# MuJoCo Simulation Setup

## Why Python 3.8?

LimX's Windows SDK wheels (`limxsdk-*-py3-none-any.whl`) vendor a compiled `_robot.pyd`
that links against **`python38.dll`** specifically. Despite the `py3-none-any` tag, the
binary will not load under any other Python version.

```
_robot.pyd -> python38.dll, SHLWAPI.dll, KERNEL32.dll, MSVCP140.dll, ...
```

The MCP server itself runs on Python 3.11+ (FastMCP requirement). Simulations launch
as child processes under a dedicated **Python 3.8 interpreter** (`LIMX_SIM_PYTHON`).

## One-Time Setup

```powershell
# 1. Init submodules (brings in robot-description, humanoid-description, limxsdk-lowlevel)
cd D:\Dev\repos\external\tron1-mujoco-sim
git submodule update --init --recursive
cd D:\Dev\repos\external\humanoid-mujoco-sim
git submodule update --init --recursive

# 2. Create sim Python 3.8 environment (downloads embeddable Python 3.8.10)
cd D:\Dev\repos\limx-robotics-mcp
.\setup-sim-env.ps1

# 3. Start the MCP server
.\start.ps1
```

## What `setup-sim-env.ps1` does

| Step | Detail |
|------|--------|
| Download | `python-3.8.10-embed-amd64.zip` from python.org (~8 MB) |
| Extract | To `.venv-sim38/` in the repo root |
| Enable site | Patches `python38._pth` to uncomment `import site` |
| Pip | Downloads `get-pip.py` from the legacy 3.8 branch |
| Dependencies | `mujoco~=3.1.6`, `numpy~=1.24` |
| SDK wheel | `limxsdk-3.4.2-py3-none-any.whl` from `external/limxsdk-lowlevel/` (installed `--no-deps`) |

Verification: `python -c "import mujoco; import limxsdk.robot.Robot"`

## Known Limitations

### 1. Pointfoot only (TRON 1)

The upstream `tron1-mujoco-sim/simulator.py` **hardcodes** the pointfoot model path:

```python
model_path = robot-description/pointfoot/{ROBOT_TYPE}/xml/robot.xml
```

Wheellegged models (`WL_*`) exist in `robot-description/wheellegged/` but the
simulator script does not load them. Valid `ROBOT_TYPE` values:

| Variant | Description |
|---------|-------------|
| `PF_TRON1A` | PointFoot TRON1-A (default) |
| `PF_TRON1A_2025` | PointFoot TRON1-A 2025 revision |
| `SF_TRON1A` | SpringFoot TRON1-A |
| `SF_TRON1A_2025` | SpringFoot TRON1-A 2025 revision |
| `WF_TRON1A` | WheelFoot TRON1-A |

Full list: use the `list_robot_variants` tool.

### 2. Oli model path contract

The oli simulator resolves the description path from `ROBOT_TYPE`:

```python
MAIN_TYPE = ROBOT_TYPE.rsplit("_", 1)[0]  # e.g. "HU_D03_03" -> "HU_D03"
model_path = humanoid-description/{MAIN_TYPE}_description/xml/{ROBOT_TYPE}.xml
```

Valid Oli variants:

| Variant | Description |
|---------|-------------|
| `HU_D03_03` | D03 series, config 03 |
| `HU_D04_01` | D04 series, config 01 |

### 3. GUI requirement

Both simulators open a **MuJoCo viewer window** (interactive 3D render). There is
no headless / offscreen rendering mode in the upstream scripts. The viewer blocks
the process until the window is closed.

The MCP server launches the simulator as a **background process** (`Popen`), records
logs, and provides `stop_sim` / `sim_jobs` for lifecycle management. The MuJoCo
window appears on the desktop independently of the MCP server.

### 4. Windows SDK wheel quirk

The `.whl` files ship inside the sim repos at `limxsdk-lowlevel/python3/win/`.
The `tron1-mujoco-sim` repo has an older version (`3.4.0`) while the standalone
`external/limxsdk-lowlevel` has `3.4.2`. The setup script uses `3.4.2`.

If the SDK ever updates, replace the wheel path in `setup-sim-env.ps1`.

## Running

### Via MCP tools

```python
# Start a TRON 1 simulation
await start_sim(platform="tron1", robot_type="PF_TRON1A")
# -> job_id "a1b2c3d4"

# Check it's running
await sim_jobs()
await sim_jobs(job_id="a1b2c3d4", log_tail_lines=50)

# Stop it
await stop_sim(job_id="a1b2c3d4")
```

### Direct (without MCP, for debugging)

```powershell
cd D:\Dev\repos\external\tron1-mujoco-sim
$env:ROBOT_TYPE = "PF_TRON1A"
D:\Dev\repos\limx-robotics-mcp\.venv-sim38\Scripts\python.exe .\simulator.py
```

## Troubleshooting

| Symptom | Likely cause |
|---------|-------------|
| `ImportError: No module named mujoco` | `setup-sim-env.ps1` not run, or `LIMX_SIM_PYTHON` points to wrong venv |
| `OSError: python38.dll not found` | Sim running under MCP's Python (3.11+) instead of the sim interpreter |
| `FileNotFoundError: robot.xml` | Submodules not initialized — `git submodule update --init --recursive` in the sim repo |
| `Failed to launch simulator` | `simulator.py` not found — clone with `--recurse-submodules` |
| Viewer opens and immediately closes | Missing model file or wrong `ROBOT_TYPE` — check log tail |
| Process hangs on `wait()` | MuJoCo viewer still open; close the window or use `stop_sim` (sends terminate, then kill after 5s) |

## File Layout

```
D:\Dev\repos\external\
├── tron1-mujoco-sim/           # TRON 1 MuJoCo sim (upstream)
│   ├── simulator.py            # Entry point (reads ROBOT_TYPE env)
│   ├── robot-description/      # URDF/XML models (git submodule)
│   │   ├── pointfoot/          # PF_*, SF_*, WF_* variants
│   │   └── wheellegged/        # WL_* variants (not loaded by simulator.py)
│   └── limxsdk-lowlevel/       # Windows SDK wheels (git submodule)
│
├── humanoid-mujoco-sim/        # Oli humanoid MuJoCo sim (upstream)
│   ├── simulator.py            # Entry point
│   └── humanoid-description/   # HU_* model files (git submodule)
│
└── limxsdk-lowlevel/           # Standalone SDK (may be newer than sim submodule)

D:\Dev\repos\limx-robotics-mcp\
├── .venv-sim38/                # Python 3.8 venv (created by setup-sim-env.ps1)
├── src/limx_robotics_mcp/      # FastMCP server
├── logs/                        # Simulation output logs
├── setup-sim-env.ps1           # One-time setup script
├── start.ps1                    # Launch both backend and MCP server
├── install-mcp.ps1              # Register in Cursor / Claude Desktop
├── justfile                     # Development recipes
└── docs/SIM_SETUP.md           # This file
```
