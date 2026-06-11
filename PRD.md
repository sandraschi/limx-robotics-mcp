# limx-robotics-mcp — Product Requirements Document

**Version**: 0.2.0  
**Status**: Active  
**Last Updated**: 2026-06-11  

## 1. Purpose

Expose LimX Dynamics' open-source robotics stack (TRON 1 biped, Oli humanoid) as
MCP tools for simulation, training, and visualization — no hardware required.

## 2. Scope

### In scope (v0.2)

| # | Feature | Priority | Description |
|---|---------|----------|-------------|
| 1 | MuJoCo sim lifecycle | P0 | start/stop/status/logs for TRON 1 and Oli simulators |
| 2 | Robot description access | P0 | URDF/USD/XML model files for any variant |
| 3 | VLA policy deployment | P1 | Run trained RL policies via LimX deploy pipeline |
| 4 | Fleet visualization bridge | P1 | Export models as GLB for godot-mcp / unity3d-mcp |
| 5 | Web dashboard | P2 | 7-page React dashboard with Prefab cards |
| 6 | AI agentic workflows | P1 | Multi-step sim orchestration via LLM sampling (ctx.sample + Ollama fallback) |
| 7 | Natural language control | P1 | "Make it crouch" → LLM → actuator values |
| 8 | Conversational state analysis | P2 | LLM reads sim state.json, describes posture/behaviour |
| 9 | Conversational log analysis | P2 | LLM tails sim logs, root-cause diagnosis |
| 10 | Smart model discovery | P2 | LLM generates GitHub URLs, downloads + validates MJCF |
| 11 | Dual transport | P1 | stdio (Claude Desktop) + HTTP streamable |

### AI Workflow Tools (5 total)

All AI tools follow a consistent pattern: try FastMCP `ctx.sample()` first, fall back to Ollama:

| Tool | Input | Output | Fallback |
|------|-------|--------|----------|
| `agentic_sim_workflow` | Goal string | Plan + execution log | Ollama llama3.2:3b |
| `natural_language_control` | NL prompt, job_id | Actuator control.json | Ollama |
| `analyze_sim_state` | job_id | Posture/behaviour description | Ollama |
| `analyze_sim_logs` | job_id | Error diagnosis + fix suggestions | Ollama |
| `discover_model` | Description string | Downloaded MJCF model(s) | Ollama |

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

### US-005: Agentic sim workflow

```python
await agentic_sim_workflow(goal="Start TRON 1, make it walk for 10 seconds, then analyze gait")
# → LLM plans: start_sim → get_state loop → apply_control → analyze
# → Returns plan log and observations
```

### US-006: Natural language robot control

```python
await natural_language_control(prompt="Bend the right knee 30 degrees", job_id="a1b2c3d4")
# → LLM translates to actuator values, writes control.json
```

### US-007: Discover and load any MuJoCo model

```python
await discover_model(description="Unitree H1 humanoid for MuJoCo")
# → LLM generates candidate URLs, downloads MJCF, validates XML
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
