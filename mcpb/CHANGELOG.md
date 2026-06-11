# Changelog

## 0.2.0 (2026-06-11)

- Add `export_model_for_fleet` — URDF→GLB conversion for godot-mcp/unity3d-mcp
- Add `list_policies` / `run_deployed_policy` — VLA policy deploy bridge
- Add fleet visualization pipeline (limx ↔ godot ↔ unity3d)
- Create PRD.md, CHANGELOG.md
- Create MCD project page at mcp-central-docs/projects/limx-robotics-mcp/
- Create web_sota/ React dashboard with Prefab cards (ports 11026/11027)
- Add AGENTS.md per-repo config
- docs/SIM_SETUP.md — complete MuJoCo setup guide with architecture diagram

## 0.1.0 (2026-06-11)

- MuJoCo sim lifecycle: start_sim, stop_sim, sim_jobs
- Robot model access: list_robot_variants, get_robot_description
- sim_status health check
- .venv-sim38 Python 3.8 environment with mujoco + limxsdk
- setup-sim-env.ps1, start.ps1, install-mcp.ps1, justfile
- llms.txt / llms-full.txt for Claude Desktop discovery
- All upstream repos cloned to external/ with submodule init
