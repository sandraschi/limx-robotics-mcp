# limx-robotics-mcp Tool Reference

14 tools: 9 core sim + model access + RL deployment + 5 AI workflow assistants.

**Supported platforms:** TRON 1 (biped, variants: PF_TRON1A, SF_TRON1A, WF_TRON1A) and Oli (humanoid, variants: HU_D03_03, HU_D04_01, etc.)

---

## Core Tools (1-9)

### sim_status

**Description:** Health check — probes external repos, submodule population, Windows SDK wheels, and sim Python environment.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| — | — | — | No parameters |

**Output:**
```json
{
  "success": true,
  "ready": true,
  "repos": {"tron1-mujoco-sim": true, "humanoid-mujoco-sim": true, "humanoid-description": true, "limxsdk-lowlevel": true},
  "submodules": {"tron1 simulator.py": true, "tron1 robot-description populated": true, "oli simulator.py": true, "oli humanoid-description populated": true},
  "sim_environment": {"sim_python": "D:/.../.venv-sim38/Scripts/python.exe", "exists": true, "deps_ok": true, "detail": "3.8.20 mujoco 3.1.6"},
  "running_jobs": []
}
```

**Examples:**
```python
await sim_status()
```

**State machine effect:** None — read-only. Jobs use SimJob dataclass (running / exited).

---

### start_sim

**Description:** Start a LimX MuJoCo simulation as a managed background process. Opens a MuJoCo viewer window. The LimX Windows SDK requires Python 3.8.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| platform | str | No | Platform: "tron1" or "oli" (default: "tron1") |
| robot_type | str | No | ROBOT_TYPE (default: "PF_TRON1A"). Use list_robot_variants to discover |

**Output:**
```json
{"success": true, "message": "Simulation started (job a1b2c3d4). MuJoCo viewer window should be open.", "job_id": "a1b2c3d4", "platform": "tron1", "robot_type": "PF_TRON1A", "pid": 12345, "status": "running"}
```

**Examples:**
```python
await start_sim(platform="tron1", robot_type="PF_TRON1A")
await start_sim(platform="oli", robot_type="HU_D04_01")
```

---

### stop_sim

**Description:** Stop a running simulation job. Terminates with 5s graceful timeout, then kills.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| job_id | str | Yes | Job ID from start_sim |

**Output:**
```json
{"success": true, "message": "Job a1b2c3d4 stopped.", "job_id": "a1b2c3d4", "platform": "tron1", "robot_type": "PF_TRON1A", "pid": 12345, "status": "exited (0)"}
```

**Examples:**
```python
await stop_sim(job_id="a1b2c3d4")
```

---

### sim_jobs

**Description:** List all simulation jobs (running and exited), or detail one job with its log tail.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| job_id | str | No | Optional: detail view with log tail for one job |
| log_tail_lines | int | No | Log lines to include (default: 25, max: 200) |

**Output:**
```json
{"success": true, "message": "3 job(s) this session.", "jobs": [{"job_id": "a1b2c3d4", "platform": "tron1", "robot_type": "PF_TRON1A", "status": "running", "uptime_s": 30.5}]}
```

**Examples:**
```python
await sim_jobs()
await sim_jobs(job_id="a1b2c3d4", log_tail_lines=50)
```

---

### list_robot_variants

**Description:** List valid ROBOT_TYPE values for a platform, discovered from the description repos.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| platform | str | No | Platform: "tron1" or "oli" (default: "tron1") |

**Output:**
```json
{"success": true, "message": "6 variants for tron1.", "variants": ["PF_TRON1A", "PF_TRON1A_V2", "SF_TRON1A", "SF_TRON1A_V2", "WF_TRON1A", "WF_TRON1A_V2"]}
```

**Examples:**
```python
await list_robot_variants(platform="tron1")
await list_robot_variants(platform="oli")
```

---

### get_robot_description

**Description:** Locate robot description files (URDF/USD/XML) for a LimX platform. Returns file paths and optionally inline content.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| platform | str | No | Platform: "oli" or "tron1" (default: "oli") |
| variant | str | No | Robot variant (default: "HU_D04_01" for oli, "PF_TRON1A" for tron1) |
| format | str | No | Format: "urdf", "usd", or "xml" (default: "urdf") |
| include_content | bool | No | Return file content inline capped at 200 KB (default: False) |

**Output:**
```json
{"success": true, "message": "Found 12 .urdf file(s) for oli/HU_D04_01.", "platform": "oli", "variant": "HU_D04_01", "format": "urdf", "files": [{"path": "...", "size_bytes": 5000}, ...]}
```

**Examples:**
```python
await get_robot_description(platform="oli", variant="HU_D04_01", format="urdf")
await get_robot_description(platform="tron1", variant="PF_TRON1A", format="xml", include_content=True)
```

---

### export_model_for_fleet

**Description:** Export a LimX robot model to the fleet exchange for godot-mcp / unity3d-mcp. Supports GLB (single scene from STL meshes) or mesh-bundle (zip of STLs).

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| platform | str | No | Platform: "tron1" or "oli" (default: "oli") |
| variant | str | No | Robot variant (default: "HU_D04_01") |
| format | str | No | Export format: "glb" or "mesh-bundle" (default: "glb") |

**Output:**
```json
{"success": true, "message": "GLB exported (12 meshes, 4500 KB). Import with godot_import_glb.", "path": "D:/.../_exchange/models/limx/oli_HU_D04_01.glb", "mesh_count": 12, "total_faces": 24000, "import_hint": "await godot_import_glb(path=r'...')"}
```

**Examples:**
```python
await export_model_for_fleet(platform="oli", variant="HU_D04_01")
await export_model_for_fleet(platform="tron1", variant="PF_TRON1A", format="mesh-bundle")
```

---

### list_policies

**Description:** List available RL deployment policies/controllers for a platform from the RL deploy repos.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| platform | str | No | Platform: "tron1" or "oli" (default: "tron1") |

**Output:**
```json
{"success": true, "message": "3 policy/controller(s).", "policies": [{"name": "walk_v2", "type": "dir", "size_bytes": 204800}, {"name": "stand_ctrl", "type": "script", "size_bytes": 5000}]}
```

**Examples:**
```python
await list_policies(platform="tron1")
await list_policies(platform="oli")
```

---

### run_deployed_policy

**Description:** Run a trained RL policy on the simulated (or real) robot via the LimX deploy pipeline.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| platform | str | No | Platform (default: "tron1") |
| policy_name | str | No | Policy directory name from list_policies |
| robot_type | str | No | ROBOT_TYPE for the sim (default: "PF_TRON1A") |

**Output:**
```json
{"success": true, "message": "Policy exited (code 0).", "exit_code": 0, "log_path": "...", "log": "..."}
```

**Examples:**
```python
await run_deployed_policy(platform="tron1", policy_name="walk_v2", robot_type="PF_TRON1A")
```

---

## AI Workflow Tools (10-14)

### agentic_sim_workflow

**Description:** Uses the host LLM to plan and execute a multi-step LimX simulation workflow. Falls back to Ollama.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| goal | str | Yes | Natural language goal |
| ctx | Context | Yes | FastMCP context (injected automatically) |

**Output:**
```json
{"success": true, "message": "Workflow completed.", "plan_and_result": "...", "sampling_used": true}
```

**Examples:**
```python
await agentic_sim_workflow(goal="Start a TRON 1 sim and make it walk")
await agentic_sim_workflow(goal="Export Oli model to fleet exchange")
```

---

### natural_language_control

**Description:** Convert a natural language command to actuator values for a running sim.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| prompt | str | Yes | Natural language command |
| job_id | str | Yes | Active sim job ID |
| ctx | Context | Yes | FastMCP context (injected automatically) |

**Output:**
```json
{"success": true, "message": "Generated 3 actuator commands.", "controls": {"hip_joint": 0.5}, "source": "sampling"}
```

**Examples:**
```python
await natural_language_control(prompt="bend the right knee 30 degrees", job_id="a1b2c3d4")
```

---

### analyze_sim_state

**Description:** Read the current sim state and produce a natural-language analysis.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| job_id | str | Yes | Sim job ID |
| ctx | Context | Yes | FastMCP context (injected automatically) |

**Output:**
```json
{"success": true, "message": "State analyzed.", "analysis": "The robot is standing upright...", "sampling_used": true}
```

**Examples:**
```python
await analyze_sim_state(job_id="a1b2c3d4")
```

---

### analyze_sim_logs

**Description:** Read the sim log file (last 100 lines) and ask the LLM for root-cause analysis.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| job_id | str | Yes | Sim job ID |
| ctx | Context | Yes | FastMCP context (injected automatically) |

**Output:**
```json
{"success": true, "message": "Logs analyzed.", "analysis": "...", "sampling_used": true}
```

**Examples:**
```python
await analyze_sim_logs(job_id="a1b2c3d4")
```

---

### discover_model

**Description:** Generate candidate GitHub raw URLs for MuJoCo MJCF/XML models, download and validate them.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| description | str | Yes | Model description |
| ctx | Context | Yes | FastMCP context (injected automatically) |

**Output:**
```json
{"success": true, "message": "Loaded 1/3 models.", "models_loaded": [{"url": "...", "name": "h1", "path": "..."}], "urls_tried": [...]}
```

**Examples:**
```python
await discover_model(description="Unitree H1 humanoid MuJoCo model")
```
