# LimX Open-Source Repositories

LimX Dynamics maintains 10 public open-source repositories on GitHub under `github.com/limxdynamics/`. This document catalogs each repo, its license, language, entry points, and use cases.

## Pipeline Overview

```
humanoid-description ──┬──→ tron1-mujoco-sim / humanoid-mujoco-sim → simulator.py
                       │
                       ├──→ limxsdk-lowlevel → RL deploy pipelines
                       │
                       └──→ tron1-rl-isaaclab / tron1-rl-isaacgym → trained policies → deploy
```

---

## TRON 1 Platform

### tron1-mujoco-sim

| Field | Value |
|-------|-------|
| License | Apache 2.0 |
| Language | Python |
| Key files | `simulator.py` — entry point (reads `ROBOT_TYPE` env var) |
| Submodules | `robot-description/` — URDF/XML/MJCF models; `limxsdk-lowlevel/` — Windows SDK wheels |
| Purpose | Run TRON 1 MuJoCo simulation with real-time control |
| Status | Active (24 stars) |

### tron1-rl-isaacgym

| Field | Value |
|-------|-------|
| License | Apache 2.0 |
| Language | Python |
| Key files | `legged_gym/` — training environments; `setup.py` — install |
| Purpose | GPU-accelerated RL training for TRON 1 on NVIDIA Isaac Gym |
| Status | Active (123 stars — most popular LimX repo) |

### tron1-rl-isaaclab

| Field | Value |
|-------|-------|
| License | Apache 2.0 |
| Language | Python |
| Key files | `exts/` — Isaac Lab extensions; `rsl_rl/` — RL algorithms; `scripts/` — training entry points |
| Purpose | Advanced RL/NPC training for TRON 1 on NVIDIA Isaac Lab |
| Status | Active (65 stars) |

### tron1-rl-deploy-python

| Field | Value |
|-------|-------|
| License | Apache 2.0 |
| Language | Python |
| Key files | `main.py` — deployment entry point; `controllers/` — trained policy directories |
| Submodules | `limxsdk-lowlevel/` — SDK wheels |
| Purpose | Deploy trained RL policies to TRON 1 (sim or hardware) |
| Status | Active (27 stars) |

### tron1-rl-deploy-ros2

| Field | Value |
|-------|-------|
| License | Apache 2.0 |
| Language | Python/C++ |
| Key files | ROS2 packages under `src/` |
| Purpose | ROS2-native policy deployment for TRON 1 |
| Status | Active |

### tron1-gazebo-ros2

| Field | Value |
|-------|-------|
| License | Apache 2.0 |
| Language | Python/C++ |
| Purpose | Full-physics TRON 1 simulation in Gazebo with ROS2 |
| Status | Active (8 stars) |

---

## Oli Humanoid Platform

### humanoid-mujoco-sim

| Field | Value |
|-------|-------|
| License | Apache 2.0 |
| Language | Python |
| Key files | `simulator.py` — entry point; `prebuild/` — prebuilt binaries |
| Submodules | `humanoid-description/` — URDF/xml models; `limxsdk-lowlevel/` — SDK wheels |
| Purpose | Run Oli humanoid MuJoCo simulation with real-time control |
| Status | Active |

### humanoid-description

| Field | Value |
|-------|-------|
| License | Apache 2.0 |
| Language | XML/URDF/USD |
| Structure | `HU_D03_description/` (D03 gen) + `HU_D04_description/` (D04 gen), each with `xml/`, `urdf/`, `usd/`, `meshes/` |
| Purpose | Standalone robot model files for Oli — shared by sim, deploy, and visualization pipelines |
| Status | Active |

### humanoid-rl-deploy-python

| Field | Value |
|-------|-------|
| License | Apache 2.0 |
| Language | Python |
| Key files | `main.py` — deployment entry point; `controllers/` — trained policy directories |
| Purpose | Deploy trained RL policies to Oli (sim or hardware) |
| Status | Active |

### humanoid-rl-deploy-ros2

| Field | Value |
|-------|-------|
| License | Apache 2.0 |
| Language | Python/C++ |
| Submodules | `limxsdk-lowlevel/` |
| Purpose | ROS2-native policy deployment for Oli |
| Status | Active |

---

## Shared Infrastructure

### limxsdk-lowlevel

| Field | Value |
|-------|-------|
| License | Apache 2.0 |
| Language | C++11 (with Python bindings) |
| Key files | `python3/win/limxsdk-*-py3-none-any.whl` — pre-built Windows wheels; `lib/` — C++ libraries; `include/` — headers |
| CMakeLists | Yes (for building from source on Linux) |
| Purpose | Low-level real-time motion control SDK shared by all LimX platforms |
| Windows SDK note | Wheels vendor `_robot.pyd` linked against `python38.dll` — simulations require Python 3.8 |

---

## Repository Dependency Graph

```
humanoid-description  (shared model files for Oli)
       │
       ▼
humanoid-mujoco-sim  ───→  simulator.py  ───→  humanoid-rl-deploy-python
       │                                              │
       ▼                                              ▼
limxsdk-lowlevel  (C++11 SDK + Python bindings)   humanoid-rl-deploy-ros2
       │
       ▼
tron1-mujoco-sim  ───→  simulator.py  ───→  tron1-rl-deploy-python
       │                                              │
       ▼                                              ▼
robot-description  (TRON 1 URDF models)        tron1-rl-deploy-ros2
       │
       ├──→  tron1-rl-isaaclab  (advanced RL training)
       │
       └──→  tron1-rl-isaacgym  (GPU-accelerated RL training)
       │
       └──→  tron1-gazebo-ros2  (full-physics sim)
```

All repos use **Apache 2.0** license. The `tron1-mujoco-sim` submodule `robot-description/` is sourced from `limxdynamics/robot-description`.
