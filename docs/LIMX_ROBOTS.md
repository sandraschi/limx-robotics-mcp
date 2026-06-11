# LimX Robots — Hardware Platforms

## TRON 1

**TRON 1** is a bipedal/two-wheeled balancing robot designed for R&D, education, and algorithm development. It is LimX's primary developer platform.

### Variants

| Variant ID | Description | Foot Type |
|------------|-------------|-----------|
| `PF_TRON1A` | PointFoot TRON1-A (default) | Stiff point feet |
| `PF_TRON1A_2025` | PointFoot TRON1-A, 2025 revision | Stiff point feet, updated joints |
| `SF_TRON1A` | SpringFoot TRON1-A | Compliant spring-loaded feet |
| `SF_TRON1A_2025` | SpringFoot TRON1-A, 2025 revision | Compliant spring-loaded feet, updated |
| `WF_TRON1A` | WheelFoot TRON1-A | Wheeled feet for rolling locomotion |

Note: Wheellegged models (`WL_*` variants) exist in the robot-description repository but are not loadable through the upstream `simulator.py` — the script hardcodes the `pointfoot/` directory prefix. This is a confirmed upstream limitation, not a wrapper bug.

### Specifications (Approximate)

| Parameter | TRON 1 (PF_TRON1A) |
|-----------|-------------------|
| Height | ~0.6 m |
| Weight | ~12 kg |
| DOF | 10 (5 per leg) |
| Payload | ~3 kg |
| Battery | Hot-swappable Li-ion, ~2 hr runtime |
| Actuation | Brushless DC motors with harmonic drives |
| Sensors | IMU, joint encoders, foot contact sensors |
| Control | 1 kHz real-time control loop |

### Software Support

| Tool | Purpose |
|------|---------|
| MuJoCo sim | Primary simulation environment |
| Isaac Gym | GPU-accelerated RL training |
| Isaac Lab | Advanced RL/NPC training pipeline |
| ROS1/ROS2 | Sensor integration and teleoperation |
| Gazebo | Full-physics ROS2 simulation |
| RL deploy Python | Trained policy deployment |
| RL deploy ROS2 | ROS2-native policy deployment |

### Use Cases

- Locomotion algorithm research (walking, running, stair climbing)
- Balance and fall recovery development
- Reinforcement learning training and sim-to-real transfer
- Education and robotics curriculum development
- VLA (Vision-Language-Action) policy validation

---

## Oli

**Oli** is LimX's full-size humanoid robot platform for industrial inspection, manipulation research, and advanced locomotion. At approximately 1.6–1.7 m tall, Oli represents a step change in capability from the TRON 1 platform.

### Generations

| Gen | Variants | Description |
|-----|----------|-------------|
| D03 | `HU_D03_03` | First-generation full-size humanoid |
| D04 | `HU_D04_01` | Second-generation with gripper and improved actuation |

### Oli HU_D04_01 (Latest)

| Parameter | Oli HU_D04_01 |
|-----------|---------------|
| Height | ~1.65 m |
| Weight | ~50 kg |
| DOF | ~28+ (full body with arms + legs + torso) |
| Gripper | Parallel-jaw gripper (interchangeable) |
| Actuation | Custom brushless motors, harmonic drives |
| Sensors | IMU, joint encoders, foot force/torque, wrist camera |
| Control | 1 kHz real-time control loop |
| Software | MuJoCo sim, RL deploy Python/C++/ROS2 |

### Locomotion Capabilities

- Flat-ground walking and running
- Stair climbing and descending
- Uneven terrain negotiation
- Push recovery and disturbance rejection
- Standing from seated/fallen positions

### Manipulation Capabilities (D04+)

- Object grasping and relocation
- Panel/button operation
- Door opening
- Payload carrying (estimated 5–10 kg arm payload)

### Use Cases

- Industrial inspection (panel reading, gauge monitoring, thermal scanning)
- Light manipulation tasks (lever pulling, switch flipping, part placement)
- Loco-manipulation research (coordinated walking while carrying/manipulating)
- Human-robot interaction studies
- VLA policy research and deployment

---

## Common Infrastructure

Both platforms share:

| Component | Details |
|-----------|---------|
| SDK | `limxsdk-lowlevel` — C++11 with Python bindings |
| Control SDK | Real-time joint control at 1 kHz |
| MuJoCo model format | XML-based MJCF within URDF description structure |
| Policy format | TorchScript `.pt` or ONNX models |
| Deployment | Python deploy pipelines, ROS2-native interfaces |
| Simulation | MuJoCo for physics, Isaac Gym/Lab for RL training |

## Export & Visualization

Both platforms can be exported as GLB via the `export_model_for_fleet` tool for visualization in:

- **Godot 4.0** — interactive 3D scene, animation, game integration
- **Unity 3D** — XR/VR visualization
- **Fleet exchange** — `_exchange/models/limx/` for shared pipeline access
