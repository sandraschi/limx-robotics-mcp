# limx-robotics-mcp — Agent Context

## What this is
FastMCP 3.2 wrapper for LimX Dynamics open-source robotics (TRON 1 biped, Oli humanoid).
Simulations run under a Python 3.8 interpreter (SDK links python38.dll). 8 tools.

## Key paths
- `src/limx_robotics_mcp/server.py` — all 8 MCP tools (+ fleet viz bridge)
- `web_sota/backend/server.py` — FastAPI backend (port 11044)
- `web_sota/src/` — React frontend (port 11045)
- `external/` — D:\Dev\repos\external\ (10 upstream repos, NOT in git)
- `.venv-sim38/` — Python 3.8 + mujoco + limxsdk (NOT in git)

## Commands
- `uv run pytest tests/ -q` — 20 unit tests
- `npx playwright test` — 16 e2e tests (from web_sota/)
- `ruff check src/ web_sota/backend/` — lint
- `uv run python -m limx_robotics_mcp` — start MCP stdio
- `.\web_sota\start.ps1` — full web dashboard

## Gotchas
- python38.dll: sims run in .venv-sim38, not MCP Python 3.11+
- Pointfoot only: upstream simulator.py hardcodes pointfoot/ path, WL_ models don't load
- GUI viewer: MuJoCo is interactive window, not headless
- Submodules: tron1-mujoco-sim and humanoid-mujoco-sim need `git submodule update --init --recursive`
