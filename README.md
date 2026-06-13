# limx-robotics-mcp

**LimX Dynamics[^1] robots via MCP: TRON 1 biped, Oli humanoid. MuJoCo sim, VLA[^2] policies.**

[![CI](https://github.com/sandraschi/limx-robotics-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/sandraschi/limx-robotics-mcp/actions/workflows/ci.yml)
[![Ruff](https://img.shields.io/badge/code%20style-ruff-000000.svg)](https://github.com/astral-sh/ruff)
[![FastMCP](https://img.shields.io/badge/FastMCP-3.2+-blue)](https://github.com/jlowin/fastmcp)
[![Python](https://img.shields.io/badge/python-3.11%2B-blue)](https://www.python.org)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

limx-robotics-mcp provides MCP tooling for LimX Dynamics' robot lineup: TRON 1 (bipedal, wheel-legged) and Oli (full-size humanoid). Load pre-tuned MuJoCo models, control joint positions and gaits, stream telemetry, export for fleet deployment, and run VLA policy inference — all through 14 MCP tools. The server includes a robot model depot, gait library, and bridge scripts for ros-mcp.

Built for the fleet simulation pipeline: limx-robotics-mcp models can be simulated in mujoco-mcp, controlled via ros-mcp, and exported as GLB/URDF for downstream fleet MCPs (godot-mcp visualization, freecad-mcp structural analysis).

## Table of Contents

- [Quick Start](#quick-start)
- [Tools](#tools)
- [Architecture](#architecture)
- [Documentation](#documentation)
- [Ports](#ports)
- [Footnotes](#footnotes)

## Quick Start

```powershell
# 1. Clone and enter
git clone https://github.com/sandraschi/limx-robotics-mcp
cd limx-robotics-mcp

# 2. Run the MCP server
uv run python -m limx_robotics_mcp

# 3. Or launch the full web dashboard
.\start.ps1
```

## Tools

| # | Tool | Description |
|---|------|-------------|
| 1 | `sim_status` | Health check — robot models loaded, active jobs, VLA model status |
| 2 | `load_model` | Load a LimX robot model (TRON 1, Oli) into the depot |
| 3 | `start_sim` | Start simulation with a selected robot and gait config |
| 4 | `stop_sim` | Stop simulation |
| 5 | `get_state` | Read joint positions, IMU data, foot contact states, battery telemetry |
| 6 | `apply_control` | Apply joint targets or gait commands (step height, cadence, torso pitch) |
| 7 | `list_models` | List all LimX robot models in the depot |
| 8 | `list_jobs` | List active and completed simulation jobs |
| 9 | `export_model_for_fleet` | Export model as GLB/URDF/STL for downstream fleet MCPs |
| 10 | `agentic_sim_workflow` | Multi-step robot workflow via LLM sampling |
| 11 | `natural_language_control` | Control the robot via natural language ("step over the obstacle") |
| 12 | `analyze_sim_state` | Bipedal stability analysis — ZMP[^3], foot placement, torque saturation |
| 13 | `analyze_sim_logs` | Parse sim logs for gait failures, motor limits, contact loss |
| 14 | `discover_model` | Search and download LimX robot models and gait configs |

[Full tool reference →](docs/TOOLS.md)

## Architecture

limx-robotics-mcp wraps MuJoCo physics (via mujoco-mcp-compatible configs) for simulation, with no-hardware and real-robot modes. The robot model depot stores MJCF configs pre-tuned for TRON 1 and Oli, including gait parameter presets (walking, trot, stair climbing). VLA policy inference is handled by a local ONNX Runtime session or proxied to a fleet VLA server. The export pipeline (tool 9) generates GLB/URDF/STL assets for cross-fleet handoff.

```
MCP Client  ──►  limx-robotics-mcp (FastMCP 3.2)
                        │
              ┌─────────┴──────────────┐
              │  Gait + VLA Controller  │
              │  (parameterized gaits)  │
              └─────────┬──────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
  MuJoCo Backend    ROS 2 Bridge     VLA Policy
  (mujoco-mcp)     (ros-mcp)        (ONNX/local)
```

[Architecture deep-dive →](docs/SIM_SETUP.md)

## Documentation

| Doc | Contents |
|-----|----------|
| `docs/TOOLS.md` | Full reference for all 14 tools with inputs, outputs, examples |
| `docs/SETUP.md` | Installation, LimX robot config, VLA setup, troubleshooting |
| `docs/SIM_SETUP.md` | Backend selection, ROS 2 bridge, model export pipeline |
| `docs/LIMX_ROBOTS.md` | TRON 1 and Oli specifications, DOF tables, sensor suite |

## Ports

| Port | Service |
|------|---------|
| 11044 | FastAPI backend + MCP HTTP |
| 11045 | Vite React frontend |

## Footnotes

[^1]: **LimX Dynamics** — Shenzhen-based humanoid robotics company. Products: TRON 1 (wheel-legged biped), Oli (full-size humanoid). [limxdynamics.com](https://limxdynamics.com)
[^2]: **VLA** — Vision-Language-Action model. Embodied AI that maps camera and text inputs directly to joint commands.
[^3]: **ZMP** — Zero Moment Point. A bipedal stability criterion: the robot is stable when the ZMP stays within the support polygon.
