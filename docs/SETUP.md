# limx-robotics-mcp Setup

## Prerequisites

- Python 3.11+ (for the MCP server itself)
- Python **3.8** (for the LimX MuJoCo simulators — the Windows SDK wheels link `python38.dll`)
- `uv` package manager
- Git (for cloning upstream repos)
- Visual C++ Redistributable (Windows)

## Installation

```powershell
git clone https://github.com/sandraschi/limx-robotics-mcp.git
cd limx-robotics-mcp
uv sync
```

### Clone Upstream Repos

```powershell
# Clone all upstream LimX repos (see external/README.md for full list)
# Core sim repos:
git clone --depth 1 https://github.com/limxdynamics/tron1-mujoco-sim.git external/tron1-mujoco-sim
git clone --depth 1 https://github.com/limxdynamics/humanoid-mujoco-sim.git external/humanoid-mujoco-sim
git clone --depth 1 https://github.com/limxdynamics/humanoid-description.git external/humanoid-description
git clone --depth 1 https://github.com/limxdynamics/limxsdk-lowlevel.git external/limxsdk-lowlevel

# Optional: RL deployment repos
git clone --depth 1 https://github.com/limxdynamics/tron1-rl-deploy-python.git external/tron1-rl-deploy-python
git clone --depth 1 https://github.com/limxdynamics/humanoid-rl-deploy-python.git external/humanoid-rl-deploy-python
```

### Initialize Submodules

Both `tron1-mujoco-sim` and `humanoid-mujoco-sim` have submodules for robot descriptions:

```powershell
cd external/tron1-mujoco-sim
git submodule update --init --recursive

cd ../humanoid-mujoco-sim
git submodule update --init --recursive
```

### Setup Python 3.8 Sim Environment

The LimX Windows SDK wheels link against `python38.dll`. A dedicated Python 3.8 venv is required:

```powershell
.\setup-sim-env.ps1
```

This script:
1. Downloads Python 3.8.20 if not installed
2. Creates `.venv-sim38/`
3. Installs `mujoco==3.1.6`, `numpy==1.24.4`
4. Installs the LimX SDK wheels (`--no-deps`)

Verify:
```powershell
.venv-sim38\Scripts\python.exe -c "import mujoco, limxsdk.robot.Robot; print('ok')"
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LIMX_EXTERNAL_DIR` | `D:/Dev/repos/external` | Upstream repo directory |
| `LIMX_SIM_PYTHON` | `./.venv-sim38/Scripts/python.exe` | Python 3.8 interpreter for sims |
| `LIMX_LOG_DIR` | `D:/Dev/repos/limx-robotics-mcp/logs` | Sim log output directory |
| `FLEET_EXCHANGE_ROOT` | `D:/Dev/repos/_exchange` | Fleet exchange root |

### Ports

| Service | Port |
|---------|------|
| Backend (REST + MCP HTTP) | 11044 |
| Frontend (Vite dev) | 11045 |

## Running

### MCP stdio

```powershell
uv run python -m limx_robotics_mcp
```

### Web Dashboard

```powershell
.\web_sota\start.ps1
```

## Testing

```powershell
uv run pytest tests/ -q
ruff check src/ web_sota/backend/
```

## Troubleshooting

### "Sim interpreter not found"

**Cause:** `.venv-sim38` doesn't exist or `LIMX_SIM_PYTHON` is misconfigured.  
**Fix:** Run `.\setup-sim-env.ps1`. Verify: `Test-Path .venv-sim38/Scripts/python.exe`

### "Simulator not found" on start_sim

**Cause:** Upstream sim repo not cloned or submodules not initialised.  
**Fix:** Run the clone commands above and `git submodule update --init --recursive` in each sim repo.

### "Model for ROBOT_TYPE not found"

**Cause:** The robot variant doesn't exist or submodules aren't initialised.  
**Fix:** Use `list_robot_variants(platform="tron1")` to see valid variants. Run `git submodule update --init --recursive` in the sim repo.

### Simulator exits immediately

**Cause:** Python 3.8 environment missing deps, or the upstream script can't find robot.xml.  
**Fix:** Check the log at `logs/sim_<platform>_<robot>_<job_id>.log`. Ensure `ROBOT_TYPE` env var is set correctly.

### "Python 3.8 required" from limxsdk

**Cause:** The LimX SDK wheels (`limxsdk-lowlevel`) are compiled against Python 3.8.  
**Fix:** The MCP server runs on 3.11+, but sims launch under `.venv-sim38` (Python 3.8). Verify `LIMX_SIM_PYTHON` points to a Python 3.8 interpreter.

### "No variants found" in list_robot_variants

**Cause:** Submodules not populated in the sim repos.  
**Fix:** `git submodule update --init --recursive` inside `external/tron1-mujoco-sim` (for tron1) or `external/humanoid-mujoco-sim` (for oli).

### Port 11044/11045 already in use

**Cause:** Another process is bound.  
**Fix:**
```powershell
Get-NetTCPConnection -LocalPort 11044 | ForEach { Stop-Process $_.OwningProcess -Force }
```

### GLB export fails with "trimesh not installed"

**Cause:** The `trimesh` package is not installed in the MCP server's venv.  
**Fix:** `uv pip install trimesh`

### Wheel installation fails in setup-sim-env.ps1

**Cause:** The LimX SDK wheel requires specific Visual C++ Redistributable version.  
**Fix:** Install the Visual C++ Redistributable for Visual Studio 2015-2022. Run `setup-sim-env.ps1` with `-Verbose` for details.
