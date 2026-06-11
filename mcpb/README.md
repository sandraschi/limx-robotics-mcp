# limx-robotics-mcp

**FastMCP 3.2 wrapper for LimX Dynamics' open-source robotics stack — TRON 1 biped and Oli humanoid.**

Run MuJoCo simulations, deploy VLA policies, and visualize robots in Godot/Unity — no hardware required.

[![CI](https://github.com/sandraschi/limx-robotics-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/sandraschi/limx-robotics-mcp/actions/workflows/ci.yml)
[![Ruff](https://img.shields.io/badge/code%20style-ruff-000000.svg)](https://github.com/astral-sh/ruff)
[![FastMCP](https://img.shields.io/badge/FastMCP-3.2+-blue)](https://github.com/jlowin/fastmcp)
[![Python](https://img.shields.io/badge/python-3.11%2B-blue)](https://www.python.org)
[![MuJoCo](https://img.shields.io/badge/MuJoCo-3.1.6-green)](https://mujoco.org)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)
[![Playwright](https://img.shields.io/badge/e2e-Playwright-45ba4b)](https://playwright.dev)

## Table of Contents

- [Quick Start](#quick-start)
- [Tools](#tools)
- [Web Dashboard](#web-dashboard)
- [External Repos](#external-repos)
- [Architecture](#architecture)
- [Documentation](#documentation)
- [Development](#development)
- [Ports](#ports)
- [License](#license)

## Quick Start

```powershell
# 1. Init submodules in upstream sim repos
cd D:\Dev\repos\external\tron1-mujoco-sim
git submodule update --init --recursive
cd D:\Dev\repos\external\humanoid-mujoco-sim
git submodule update --init --recursive

# 2. Create Python 3.8 sim environment
cd D:\Dev\repos\limx-robotics-mcp
.\setup-sim-env.ps1

# 3. Start the MCP server
uv run python -m limx_robotics_mcp

# 4. Or launch the full web dashboard
.\start.ps1
```

## Tools (14 total)

| # | Tool | Description |
|---|------|-------------|
| 1 | `sim_status` | Composite health check (env, submodules, GPU) |
| 2 | `start_sim` | Launch MuJoCo sim (TRON 1 or Oli MuJoCo) |
| 3 | `stop_sim` | Terminate a running sim |
| 4 | `sim_jobs` | List/query active and completed sim jobs |
| 5 | `list_robot_variants` | Discover available robot model variants |
| 6 | `get_robot_description` | Get URDF/USD/XML model file content |
| 7 | `list_policies` | List available RL/VLA policies |
| 8 | `run_deployed_policy` | Deploy a trained RL policy to a sim |
| 9 | `export_model_for_fleet` | Export robot as GLB for Godot/Unity |
| 10 | `agentic_sim_workflow` | 🤖 Autonomous multi-step sim via LLM |
| 11 | `natural_language_control` | 🎯 "Make it crouch" → actuator values |
| 12 | `analyze_sim_state` | 📊 LLM describes robot behaviour from state |
| 13 | `analyze_sim_logs` | 🔍 LLM diagnoses issues from logs |
| 14 | `discover_model` | 🌐 LLM generates URLs, downloads MJCF models |

## Web Dashboard

Browser-based UI on **http://127.0.0.1:11045** with pages:
- **Dashboard** — health status, running jobs, quick actions
- **Simulations** — start/stop sims, live log tail, auto-refresh
- **Models** — browse variants, descriptions, export GLB
- **Policies** — list and run RL/VLA policies
- **Logging** — terminal-style log viewer with filters
- **LLM** — local Ollama/LM Studio chat
- **Settings** — environment configuration

## External Repos

Upstream LimX repositories cloned under `D:\Dev\repos\external/`:

| Repo | Stars | Purpose |
|------|-------|---------|
| `tron1-mujoco-sim` | 24 | TRON 1 MuJoCo simulation |
| `humanoid-mujoco-sim` | — | Oli humanoid MuJoCo simulation |
| `humanoid-description` | — | URDF/USD/XML robot model files |
| `limxsdk-lowlevel` | — | C++11/Python low-level motor SDK |
| `tron1-rl-isaaclab` | 65 | Isaac Lab RL training env |
| `tron1-rl-isaacgym` | 123 | Isaac Gym RL training env |
| `tron1-rl-deploy-python` | 27 | Python RL deployment pipeline |
| `humanoid-rl-deploy-python` | — | Oli RL deployment pipeline |
| `tron1-gazebo-ros2` | 8 | Gazebo + ROS2 simulation |

## Architecture

```
Claude Desktop / Cursor
    │ (MCP stdio/HTTP)
    ▼
limx-robotics-mcp (FastMCP 3.2) ──┬── start_sim → .venv-sim38/python simulator.py
    │                             ├── list_policies → tron1-rl-deploy-python/main.py
    │                             └── export_model → _exchange/models/limx/*.glb
    │                                                  → godot-mcp / unity3d-mcp
    ▼
Web Dashboard (Vite + React, :11045)
    └── backend (FastAPI, :11044)
```

## Documentation

| Doc | Contents |
|-----|----------|
| `docs/SIM_SETUP.md` | Full MuJoCo setup guide, known limitations, troubleshooting |
| `docs/LIMX_COMPANY.md` | LimX Dynamics — company background and strategy |
| `docs/LIMX_ROBOTS.md` | TRON 1 biped and Oli humanoid platform details |
| `docs/LIMX_FOSS.md` | All open-source repos, licenses, and capabilities |

## Development

```powershell
just lint        # ruff check
just fix         # ruff --fix
just serve       # start MCP server (stdio)
just web         # start web dashboard (requires .\setup-sim-env.ps1 first)
just submodules  # init upstream git submodules
```

## Ports

| Port | Service |
|------|---------|
| 11044 | FastAPI backend + MCP HTTP |
| 11045 | Vite React frontend (dev) |

## License

Apache 2.0 (this wrapper). Upstream LimX repos use Apache 2.0 or open academic licenses.
