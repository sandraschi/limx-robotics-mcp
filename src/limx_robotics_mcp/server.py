"""limx-robotics-mcp — FastMCP 3.2 wrapper for LimX Dynamics open-source robotics stack.

Wraps the LimX MuJoCo simulators (TRON 1 biped, Oli humanoid) and robot
description repos as MCP tools. Simulations run as managed background
processes (start/stop/status) because the upstream simulator.py opens a
GUI MuJoCo viewer and runs until closed — a blocking subprocess.run() can
never work here.

Upstream contract (verified against repos as of 2026-06-11):
- Both simulators require the ROBOT_TYPE env var and exit immediately without it.
- tron1-mujoco-sim loads robot-description/pointfoot/{ROBOT_TYPE}/xml/robot.xml
  (pointfoot variants only; wheellegged WL_* models exist but the upstream
  script does not load them).
- humanoid-mujoco-sim loads
  humanoid-description/{MAIN}_description/xml/{ROBOT_TYPE}.xml where MAIN is
  ROBOT_TYPE.rsplit('_', 1)[0] (e.g. HU_D03_03 -> HU_D03).
- The Windows limxsdk wheels (3.4.0 and 3.4.2) vendor a _robot.pyd linked
  against python38.dll despite the py3-none-any tag — sims MUST run under
  Python 3.8. The MCP server itself runs on 3.11/3.12 (FastMCP requirement),
  so simulations launch under a dedicated sim interpreter (LIMX_SIM_PYTHON,
  default .venv-sim38: Python 3.8.20 + mujoco 3.1.6 + numpy 1.24.4 +
  limxsdk 3.4.2 installed --no-deps).
"""

import os
import subprocess
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Annotated, Any

from fastmcp import FastMCP
from pydantic import Field

EXTERNAL = Path(os.getenv("LIMX_EXTERNAL_DIR", "D:/Dev/repos/external"))
TRON1_MUJOCO = EXTERNAL / "tron1-mujoco-sim"
HUMANOID_MUJOCO = EXTERNAL / "humanoid-mujoco-sim"
HUMANOID_DESC = EXTERNAL / "humanoid-description"
LIMXSDK = EXTERNAL / "limxsdk-lowlevel"
LOG_DIR = Path(os.getenv("LIMX_LOG_DIR", "D:/Dev/repos/limx-robotics-mcp/logs"))
SIM_PYTHON = Path(os.getenv("LIMX_SIM_PYTHON", "D:/Dev/repos/limx-robotics-mcp/.venv-sim38/Scripts/python.exe"))

PLATFORMS = {
    "tron1": {"repo": TRON1_MUJOCO, "script": TRON1_MUJOCO / "simulator.py"},
    "oli": {"repo": HUMANOID_MUJOCO, "script": HUMANOID_MUJOCO / "simulator.py"},
}
RL_DEPLOY = {
    "tron1": {"repo": EXTERNAL / "tron1-rl-deploy-python", "entry": EXTERNAL / "tron1-rl-deploy-python" / "main.py"},
    "oli":   {"repo": EXTERNAL / "humanoid-rl-deploy-python", "entry": EXTERNAL / "humanoid-rl-deploy-python" / "main.py"},
}

mcp = FastMCP(name="limx-robotics-mcp")


# ---------------------------------------------------------------------------
# Robot variant discovery
# ---------------------------------------------------------------------------

def _tron1_variants() -> list[str]:
    """Pointfoot variants only — the upstream simulator hardcodes the pointfoot path."""
    base = TRON1_MUJOCO / "robot-description" / "pointfoot"
    if not base.exists():
        return []
    return sorted(d.name for d in base.iterdir() if d.is_dir() and (d / "xml" / "robot.xml").exists())


def _oli_variants() -> list[str]:
    """Variants are the xml model names inside HU_*_description/xml/ in the sim's submodule."""
    base = HUMANOID_MUJOCO / "humanoid-description"
    if not base.exists():
        return []
    variants = []
    for desc_dir in base.glob("*_description"):
        variants.extend(p.stem for p in (desc_dir / "xml").glob("*.xml"))
    return sorted(variants)


def _model_path_for(platform: str, robot_type: str) -> Path:
    if platform == "tron1":
        return TRON1_MUJOCO / "robot-description" / "pointfoot" / robot_type / "xml" / "robot.xml"
    main_type = robot_type.rsplit("_", 1)[0]
    return HUMANOID_MUJOCO / "humanoid-description" / f"{main_type}_description" / "xml" / f"{robot_type}.xml"


# ---------------------------------------------------------------------------
# Simulation job manager
# ---------------------------------------------------------------------------

@dataclass
class SimJob:
    job_id: str
    platform: str
    robot_type: str
    proc: subprocess.Popen
    log_path: Path
    started_at: float = field(default_factory=time.time)

    def status(self) -> str:
        code = self.proc.poll()
        if code is None:
            return "running"
        return f"exited ({code})"

    def info(self, log_tail_lines: int = 0) -> dict[str, Any]:
        d: dict[str, Any] = {
            "job_id": self.job_id,
            "platform": self.platform,
            "robot_type": self.robot_type,
            "pid": self.proc.pid,
            "status": self.status(),
            "uptime_s": round(time.time() - self.started_at, 1),
            "log_path": str(self.log_path),
        }
        if log_tail_lines > 0 and self.log_path.exists():
            lines = self.log_path.read_text(encoding="utf-8", errors="replace").splitlines()
            d["log_tail"] = lines[-log_tail_lines:]
        return d


JOBS: dict[str, SimJob] = {}


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

@mcp.tool()
async def start_sim(
    platform: Annotated[str, Field(description="Platform: 'tron1' (biped) or 'oli' (humanoid).")] = "tron1",
    robot_type: Annotated[
        str,
        Field(description="ROBOT_TYPE for the simulator, e.g. 'PF_TRON1A', 'SF_TRON1A', 'WF_TRON1A' "
                          "(tron1) or 'HU_D03_03', 'HU_D04_01' (oli). Use list_robot_variants to discover."),
    ] = "PF_TRON1A",
) -> dict[str, Any]:
    """Start a LimX MuJoCo simulation as a managed background process.

    Opens a MuJoCo viewer window on the desktop (the upstream simulator is
    GUI-based, not headless) and runs until stopped via stop_sim or the
    window is closed. Returns a job_id for stop_sim / sim_jobs.
    """
    if platform not in PLATFORMS:
        return {"success": False, "message": f"Unknown platform '{platform}'. Use 'tron1' or 'oli'."}
    script = PLATFORMS[platform]["script"]
    if not script.exists():
        return {"success": False, "message": f"Simulator not found: {script}. Clone with --recurse-submodules."}

    model = _model_path_for(platform, robot_type)
    if not model.exists():
        valid = _tron1_variants() if platform == "tron1" else _oli_variants()
        return {
            "success": False,
            "message": f"Model for ROBOT_TYPE '{robot_type}' not found at {model}.",
            "valid_robot_types": valid,
        }

    if not SIM_PYTHON.exists():
        return {
            "success": False,
            "message": f"Sim interpreter not found: {SIM_PYTHON}. The LimX Windows SDK requires Python 3.8 "
                       "(see README Setup) or set LIMX_SIM_PYTHON.",
        }

    job_id = uuid.uuid4().hex[:8]
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log_path = LOG_DIR / f"sim_{platform}_{robot_type}_{job_id}.log"
    env = {**os.environ, "ROBOT_TYPE": robot_type}

    log_fh = open(log_path, "w", encoding="utf-8")  # noqa: SIM115 — handle owned by child process
    try:
        proc = subprocess.Popen(
            [str(SIM_PYTHON), str(script)],
            cwd=PLATFORMS[platform]["repo"],
            env=env,
            stdout=log_fh,
            stderr=subprocess.STDOUT,
        )
    except OSError as e:
        log_fh.close()
        return {"success": False, "message": f"Failed to launch simulator: {e}"}

    JOBS[job_id] = SimJob(job_id=job_id, platform=platform, robot_type=robot_type, proc=proc, log_path=log_path)

    # Give the process a moment to fail fast (missing deps, bad model) so we
    # can report immediately instead of pretending it's running.
    time.sleep(2.0)
    job = JOBS[job_id]
    if job.proc.poll() is not None:
        return {
            "success": False,
            "message": f"Simulator exited immediately ({job.proc.returncode}). See log_tail.",
            **job.info(log_tail_lines=15),
        }
    return {"success": True, "message": f"Simulation started (job {job_id}). MuJoCo viewer window should be open.",
            **job.info()}


@mcp.tool()
async def stop_sim(
    job_id: Annotated[str, Field(description="Job id returned by start_sim.")],
) -> dict[str, Any]:
    """Stop a running simulation job (terminate, then kill after 5s)."""
    job = JOBS.get(job_id)
    if job is None:
        return {"success": False, "message": f"Unknown job '{job_id}'.", "known_jobs": list(JOBS)}
    if job.proc.poll() is None:
        job.proc.terminate()
        try:
            job.proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            job.proc.kill()
            job.proc.wait(timeout=5)
    return {"success": True, "message": f"Job {job_id} stopped.", **job.info(log_tail_lines=10)}


@mcp.tool()
async def sim_jobs(
    job_id: Annotated[str | None, Field(description="Optional: detail view with log tail for one job.")] = None,
    log_tail_lines: Annotated[int, Field(description="Log lines to include in detail view.", ge=0, le=200)] = 25,
) -> dict[str, Any]:
    """List simulation jobs (running and exited), or detail one job with its log tail."""
    if job_id is not None:
        job = JOBS.get(job_id)
        if job is None:
            return {"success": False, "message": f"Unknown job '{job_id}'.", "known_jobs": list(JOBS)}
        return {"success": True, "message": f"Job {job_id}: {job.status()}.", **job.info(log_tail_lines=log_tail_lines)}
    return {
        "success": True,
        "message": f"{len(JOBS)} job(s) this session.",
        "jobs": [j.info() for j in JOBS.values()],
    }


@mcp.tool()
async def list_robot_variants(
    platform: Annotated[str, Field(description="Platform: 'tron1' or 'oli'.")] = "tron1",
) -> dict[str, Any]:
    """List valid ROBOT_TYPE values for a platform, discovered from the description repos.

    Note: tron1 lists pointfoot variants only — wheellegged (WL_*) models exist
    in robot-description but the upstream simulator script does not load them.
    """
    if platform not in PLATFORMS:
        return {"success": False, "message": f"Unknown platform '{platform}'. Use 'tron1' or 'oli'."}
    variants = _tron1_variants() if platform == "tron1" else _oli_variants()
    if not variants:
        return {"success": False, "message": f"No variants found for {platform} — submodules initialized?"}
    return {"success": True, "message": f"{len(variants)} variants for {platform}.", "variants": variants}


@mcp.tool()
async def get_robot_description(
    platform: Annotated[str, Field(description="Platform: 'oli' or 'tron1'.")] = "oli",
    variant: Annotated[
        str | None,
        Field(description="Robot variant, e.g. 'HU_D04_01' (oli) or 'PF_TRON1A' (tron1). "
                          "Default: newest oli generation / PF_TRON1A."),
    ] = None,
    format: Annotated[str, Field(description="Format: 'urdf', 'usd', or 'xml' (oli); 'xml' or 'urdf' (tron1).")] = "urdf",
    include_content: Annotated[
        bool,
        Field(description="Return file content inline (capped at 200 KB). Default: paths and sizes only."),
    ] = False,
) -> dict[str, Any]:
    """Locate robot description files (URDF/USD/XML) for a LimX platform.

    oli  -> D:/Dev/repos/external/humanoid-description/HU_*_description/{format}/
    tron1 -> D:/Dev/repos/external/tron1-mujoco-sim/robot-description/pointfoot/{variant}/

    Returns file paths by default; set include_content=true for the file body
    (single best match, capped) — full USD/mesh payloads stay on disk.
    """
    if platform == "oli":
        variant = variant or "HU_D04_01"
        main_type = variant.rsplit("_", 1)[0]
        search_dir = HUMANOID_DESC / f"{main_type}_description"
    elif platform == "tron1":
        variant = variant or "PF_TRON1A"
        search_dir = TRON1_MUJOCO / "robot-description" / "pointfoot" / variant
    else:
        return {"success": False, "message": f"Unknown platform '{platform}'. Use 'oli' or 'tron1'."}

    if not search_dir.exists():
        valid = _oli_variants() if platform == "oli" else _tron1_variants()
        return {"success": False, "message": f"Description dir not found: {search_dir}.", "valid_variants": valid}

    files = sorted(search_dir.rglob(f"*.{format}"))
    if not files:
        available = sorted({p.suffix.lstrip(".") for p in search_dir.rglob("*") if p.is_file()})
        return {"success": False, "message": f"No .{format} files under {search_dir}.", "available_formats": available}

    result: dict[str, Any] = {
        "success": True,
        "message": f"Found {len(files)} .{format} file(s) for {platform}/{variant}.",
        "platform": platform,
        "variant": variant,
        "format": format,
        "files": [{"path": str(p), "size_bytes": p.stat().st_size} for p in files],
    }
    if include_content:
        # Prefer the exact variant-named file, else the first match.
        best = next((p for p in files if p.stem == variant), files[0])
        size = best.stat().st_size
        if size > 200_000:
            result["content_note"] = f"{best.name} is {size} bytes (> 200 KB cap); read from path instead."
        else:
            result["content"] = best.read_text(encoding="utf-8")
            result["content_path"] = str(best)
    return result


@mcp.tool()
async def sim_status() -> dict[str, Any]:
    """Health check: external repos, submodule population, SDK wheels, Python deps."""
    repos = {
        "tron1-mujoco-sim": TRON1_MUJOCO.exists(),
        "humanoid-mujoco-sim": HUMANOID_MUJOCO.exists(),
        "humanoid-description": HUMANOID_DESC.exists(),
        "limxsdk-lowlevel": LIMXSDK.exists(),
    }
    submodules = {
        "tron1 simulator.py": (TRON1_MUJOCO / "simulator.py").exists(),
        "tron1 robot-description populated": bool(_tron1_variants()),
        "oli simulator.py": (HUMANOID_MUJOCO / "simulator.py").exists(),
        "oli humanoid-description populated": bool(_oli_variants()),
    }
    win_wheels = [
        str(p)
        for repo in (TRON1_MUJOCO, HUMANOID_MUJOCO)
        for p in (repo / "limxsdk-lowlevel" / "python3" / "win").glob("*.whl")
    ]
    sim_env = {"sim_python": str(SIM_PYTHON), "exists": SIM_PYTHON.exists(), "deps_ok": False, "detail": ""}
    if SIM_PYTHON.exists():
        try:
            probe = subprocess.run(
                [str(SIM_PYTHON), "-c",
                 "import sys, mujoco, limxsdk.robot.Robot; "
                 "print(sys.version.split()[0], mujoco.__version__)"],
                capture_output=True, text=True, timeout=30,
            )
            sim_env["deps_ok"] = probe.returncode == 0
            sim_env["detail"] = (probe.stdout or probe.stderr).strip().splitlines()[-1] if (probe.stdout or probe.stderr) else ""
        except (subprocess.TimeoutExpired, OSError) as e:
            sim_env["detail"] = f"probe failed: {e}"
    ready = all(repos.values()) and all(submodules.values()) and bool(sim_env["deps_ok"])
    return {
        "success": True,
        "message": "Ready to simulate." if ready else "Not ready — see repos/submodules/sim_environment.",
        "ready": ready,
        "external_dir": str(EXTERNAL),
        "repos": repos,
        "submodules": submodules,
        "windows_sdk_wheels": win_wheels,
        "sim_environment": sim_env,
        "running_jobs": [j.info() for j in JOBS.values() if j.proc.poll() is None],
    }


# ---------------------------------------------------------------------------
# Fleet visualization bridge
# ---------------------------------------------------------------------------

FLEET_EXCHANGE = Path(os.getenv("FLEET_EXCHANGE_ROOT", "D:/Dev/repos/_exchange"))
LIMX_EXCHANGE = FLEET_EXCHANGE / "models" / "limx"


def _mesh_dir_for(platform: str, variant: str) -> Path | None:
    """Find the meshes/ directory containing STL files for a robot variant."""
    if platform == "oli":
        main_type = variant.rsplit("_", 1)[0]
        return HUMANOID_DESC / f"{main_type}_description" / "meshes" / variant
    elif platform == "tron1":
        return TRON1_MUJOCO / "robot-description" / "pointfoot" / variant / "meshes"
    return None


@mcp.tool()
async def export_model_for_fleet(
    platform: Annotated[str, Field(description="Platform: 'tron1' or 'oli'.")] = "oli",
    variant: Annotated[str, Field(description="Robot variant, e.g. 'HU_D04_01' or 'PF_TRON1A'.")] = "HU_D04_01",
    format: Annotated[str, Field(description="Export format: 'glb' (single scene), 'mesh-bundle' (zip of STLs).")] = "glb",
) -> dict[str, Any]:
    """Export a LimX robot model to the fleet exchange for godot-mcp / unity3d-mcp.

    **glb** — load all STL meshes, apply URDF transforms, write a single GLB file
    at `_exchange/models/limx/{platform}_{variant}.glb`. Import into Godot via
    ``godot_import_glb(path=...)``.

    **mesh-bundle** — copy all raw STL/USD/OBJ meshes as a zip
    at `_exchange/models/limx/{platform}_{variant}_meshes.zip`.
    """
    mesh_dir = _mesh_dir_for(platform, variant)
    if not mesh_dir or not mesh_dir.exists():
        return {"success": False, "message": f"Mesh directory not found for {platform}/{variant}."}

    stl_files = sorted(mesh_dir.rglob("*.STL")) + sorted(mesh_dir.rglob("*.stl"))
    if not stl_files:
        return {"success": False, "message": f"No STL files found in {mesh_dir}."}

    LIMX_EXCHANGE.mkdir(parents=True, exist_ok=True)

    if format == "mesh-bundle":
        import shutil
        out_name = f"{platform}_{variant}_meshes.zip"
        out_path = LIMX_EXCHANGE / out_name
        shutil.make_archive(str(out_path.with_suffix("")), "zip", root_dir=mesh_dir)
        return {
            "success": True,
            "message": f"Mesh bundle written: {out_path} ({out_path.stat().st_size / 1024:.0f} KB).",
            "path": str(out_path),
            "mesh_count": len(stl_files),
        }

    # GLB: load all STLs, center as scene, export
    try:
        import trimesh
    except ImportError:
        return {"success": False, "message": "trimesh not installed. Run: uv pip install trimesh"}

    scene = trimesh.Scene()
    total_faces = 0
    for stl_path in stl_files:
        try:
            mesh = trimesh.load_mesh(str(stl_path))
            mesh.metadata["name"] = stl_path.stem
            scene.add_geometry(mesh, node_name=stl_path.stem)
            total_faces += len(mesh.faces) if hasattr(mesh, "faces") else 0
        except Exception:
            pass  # skip problematic meshes individually

    if len(scene.geometry) == 0:
        return {"success": False, "message": "No meshes could be loaded from STLs."}

    out_name = f"{platform}_{variant}.glb"
    out_path = LIMX_EXCHANGE / out_name
    out_bytes = scene.export(file_type="glb")
    out_path.write_bytes(out_bytes)
    size_kb = len(out_bytes) / 1024

    return {
        "success": True,
        "message": f"GLB exported ({len(scene.geometry)} meshes, {size_kb:.0f} KB). Import with godot_import_glb.",
        "path": str(out_path),
        "mesh_count": len(scene.geometry),
        "total_faces": total_faces,
        "import_hint": f"await godot_import_glb(path=r'{out_path}', name='LimX_{variant}', scale=1.0)",
        "platform": platform,
        "variant": variant,
    }


@mcp.tool()
async def list_policies(
    platform: Annotated[str, Field(description="Platform: 'tron1' or 'oli'.")] = "tron1",
) -> dict[str, Any]:
    """List available RL deployment policies/controllers for a platform.

    Scans the `controllers/` directory in the platform's RL deploy repo.
    Returns the policy name, type (dir = trained model, .py = script), and size.
    """
    deploy = RL_DEPLOY.get(platform)
    if not deploy:
        return {"success": False, "message": f"Unknown platform '{platform}'."}
    repo = deploy["repo"]
    if not repo.exists():
        return {"success": False, "message": f"RL deploy repo not found at {repo}."}
    controllers_dir = repo / "controllers"
    if not controllers_dir.exists():
        return {"success": False, "message": f"No controllers/ dir in {repo}."}
    policies = []
    for child in sorted(controllers_dir.iterdir()):
        if child.is_dir():
            size = sum(f.stat().st_size for f in child.rglob("*") if f.is_file())
            policies.append({"name": child.name, "type": "dir", "size_bytes": size})
        elif child.suffix == ".py":
            policies.append({"name": child.stem, "type": "script", "size_bytes": child.stat().st_size})
    return {"success": True, "message": f"{len(policies)} policy/controller(s).", "policies": policies}


@mcp.tool()
async def run_deployed_policy(
    platform: Annotated[str, Field(description="Platform: 'tron1' or 'oli'.")] = "tron1",
    policy_name: Annotated[str, Field(description="Policy directory name from list_policies.")] = "",
    robot_type: Annotated[str, Field(description="ROBOT_TYPE for the sim (e.g. 'PF_TRON1A').")] = "PF_TRON1A",
) -> dict[str, Any]:
    """Run a trained RL policy on the real/simulated robot via the LimX deploy pipeline.

    Launches the platform's `main.py` with the specified policy and ROBOT_TYPE.
    The deploy script connects to the MuJoCo sim (or real hardware if running)
    and executes the policy's control loop.
    """
    deploy = RL_DEPLOY.get(platform)
    if not deploy:
        return {"success": False, "message": f"Unknown platform '{platform}'."}
    entry = deploy["entry"]
    if not entry.exists():
        return {"success": False, "message": f"Deploy entry not found: {entry}."}
    if not SIM_PYTHON.exists():
        return {"success": False, "message": f"Sim interpreter not found: {SIM_PYTHON}. Run setup-sim-env.ps1."}
    args = [str(entry)]
    if policy_name:
        args.extend(["--controller", policy_name])
    env = {**os.environ, "ROBOT_TYPE": robot_type}
    try:
        proc = subprocess.Popen(
            [str(SIM_PYTHON), *args], cwd=deploy["repo"], env=env,
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        )
    except OSError as e:
        return {"success": False, "message": f"Failed to launch policy: {e}"}
    job_id = uuid.uuid4().hex[:8]
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log_path = LOG_DIR / f"policy_{platform}_{policy_name}_{job_id}.log"
    with open(log_path, "wb") as f:
        stdout, _ = proc.communicate(timeout=30)
        f.write(stdout)
    return {
        "success": proc.returncode == 0,
        "message": f"Policy exited (code {proc.returncode}). See log_tail.",
        "exit_code": proc.returncode,
        "log_path": str(log_path),
        "log": stdout.decode("utf-8", errors="replace")[-3000:],
    }


def main() -> None:
    mcp.run()


if __name__ == "__main__":
    main()
