# limx-robotics-mcp — Product Requirements Document

**Version**: 0.2.0  
**Status**: Active  
**Last Updated**: 2026-06-11  

## 1. Purpose

Expose LimX Dynamics' open-source robotics stack (TRON 1 biped, Oli humanoid) as
MCP tools for simulation, training, and visualization — no hardware required.

## 2. Scope

### In scope (v0.2)

| Feature | Priority | Description |
|---------|----------|-------------|
| MuJoCo sim lifecycle | P0 | start/stop/status/logs for TRON 1 and Oli simulators |
| Robot description access | P0 | URDF/USD/XML model files for any variant |
| VLA policy deployment | P1 | Run trained RL policies via LimX deploy pipeline |
| Fleet visualization bridge | P1 | Export models as GLB for godot-mcp / unity3d-mcp |
| Web dashboard | P2 | Prefab cards showing sim status, jobs, available variants |
| Dual transport | P1 | stdio (Claude Desktop) + HTTP streamable |

### Out of scope (future)

- Headless MuJoCo mode (upstream simulator.py is GUI-only)
- Training new policies (defer to tron1-rl-isaaclab / isaacgym directly)
- Real hardware control (requires LimX hardware + safety layer)

## 3. Architecture

```
Claude Desktop / Cursor
    │ (MCP stdio/HTTP)
    ▼
limx-robotics-mcp (FastMCP 3.2)
    ├── start_sim / stop_sim / sim_jobs
    │       └── Popen → .venv-sim38/python simulator.py
    ├── list_robot_variants / get_robot_description
    │       └── filesystem scan → URDF/USD/XML
    ├── list_policies / run_deployed_policy
    │       └── Popen → tron1-rl-deploy-python/main.py
    ├── export_model_for_fleet
    │       └── URDF → GLB → fleet exchange → godot-mcp/unity3d-mcp
    └── sim_status
            └── composite health check
```

## 4. External Dependencies

| Dependency | Location | Purpose |
|-----------|----------|---------|
| tron1-mujoco-sim | `external/` | TRON 1 MuJoCo sim (upstream) |
| humanoid-mujoco-sim | `external/` | Oli humanoid MuJoCo sim (upstream) |
| humanoid-description | `external/` | URDF/USD/XML model files |
| limxsdk-lowlevel | `external/` | C++11/Python SDK (Windows .whl) |
| tron1-rl-deploy-python | `external/` | RL policy deployment pipeline |
| humanoid-rl-deploy-python | `external/` | RL policy deployment pipeline |
| Python 3.8 | `.venv-sim38/` | Sim interpreter (SDK links python38.dll) |
| godot-mcp | fleet | 3D visualization target |
| unity3d-mcp | fleet | 3D/XR visualization target |

## 5. User Stories

### US-001: Run a TRON 1 sim without hardware

```python
await start_sim(platform="tron1", robot_type="PF_TRON1A")
# → MuJoCo viewer opens, job_id returned
await sim_jobs(job_id=job_id, log_tail_lines=20)
await stop_sim(job_id=job_id)
```

### US-002: Get robot model for visualization

```python
await get_robot_description(platform="oli", variant="HU_D04_01", format="urdf")
# → URDF path and content for godot-mcp / freecad-mcp
```

### US-003: Deploy trained RL policy

```python
await list_policies(platform="tron1")
await run_deployed_policy(platform="tron1", policy_name="walk_v2")
# → Policy runs on MuJoCo sim, outputs logged
```

### US-004: Visualize robot in Godot/Unity

```python
await export_model_for_fleet(platform="oli", variant="HU_D04_01")
# → GLB written to fleet exchange, ready for godot_import_glb
```

## 6. Ports

| Service | Port | Status |
|---------|------|--------|
| MCP stdio | n/a | Active |
| MCP HTTP | 11026 | Planned |
| Web dashboard | 11027 | Planned |

## 7. Risks

| Risk | Mitigation |
|------|------------|
| python38.dll dependency | Embeddable Python 3.8 + setup-sim-env.ps1 pins the version |
| Upstream simulator.py changes | external/ repos pinned by git SHA, not floating branch |
| MuJoCo viewer blocks | Background Popen + lifecycle management |
| Windows-only SDK wheel | Linux/Mac limxsdk does not exist; WSL not tested |
