# AGENTS.md — limx-robotics-mcp

## Project Identity
- **Name**: limx-robotics-mcp
- **Purpose**: FastMCP wrapper for LimX Dynamics open-source robotics (TRON 1 biped, Oli humanoid)
- **Stack**: FastMCP 3.2+, Python 3.11+, MuJoCo 3.1.6, Python 3.8 sim interpreter
- **Ports**: 11044 (backend + MCP HTTP), 11045 (Vite dashboard)
- **External repos**: `D:\Dev\repos\external\` — 10 upstream LimX repos (git clone --depth 1)

## Key Files

| File | Purpose |
|------|---------|
| `src/limx_robotics_mcp/server.py` | FastMCP server (8 tools, 382 lines) |
| `.venv-sim38/` | Python 3.8 interpreter for MuJoCo sims |
| `docs/SIM_SETUP.md` | Full MuJoCo setup guide |
| `web_sota/` | React/Vite dashboard |
| `setup-sim-env.ps1` | One-click Python 3.8 + dep installer |
| `start.ps1` | Launch MCP server |

## Tools

- `start_sim` / `stop_sim` / `sim_jobs` — simulation lifecycle
- `list_robot_variants` / `get_robot_description` — model access
- `list_policies` / `run_deployed_policy` — VLA deploy
- `export_model_for_fleet` — URDF→GLB for godot-mcp/unity3d-mcp
- `sim_status` — health check

## Critical Gotchas

- **Python 3.8**: limxsdk wheels link `python38.dll`. Sims run in .venv-sim38.
- **Pointfoot only**: upstream simulator.py hardcodes `robot-description/pointfoot/`. WL_ models exist but won't load.
- **GUI viewer**: MuJoCo opens a real window. No headless mode.
- **Submodules**: both sim repos need `git submodule update --init --recursive`.
