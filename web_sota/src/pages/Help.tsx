import { useState } from "react";

const TABS = [
  { id: "prereqs", label: "Prerequisites" },
  { id: "troubleshooting", label: "Troubleshooting" },
  { id: "architecture", label: "Architecture" },
  { id: "limx-foss", label: "LimX FOSS" },
];

export default function Help() {
  const [tab, setTab] = useState("prereqs");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Help</h1>

      <div className="flex gap-1 flex-wrap mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "prereqs" && <Prerequisites />}
      {tab === "troubleshooting" && <Troubleshooting />}
      {tab === "architecture" && <Architecture />}
      {tab === "limx-foss" && <LimxFoss />}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-4">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Prerequisites() {
  return (
    <div className="space-y-4">
      <Card title="Python 3.11+ (MCP Server)">
        <p className="text-sm text-slate-600 mb-2">
          The FastMCP server requires Python 3.11–3.12. The project is tested with
          Python 3.12 and pinned via <code className="text-xs bg-slate-100 px-1 rounded">requires-python</code> in
          <code className="text-xs bg-slate-100 px-1 rounded">pyproject.toml</code>.
        </p>
        <pre className="bg-slate-900 text-green-300 text-xs p-3 rounded font-mono whitespace-pre-wrap">
          uv venv -p 3.12 --clear{"\n"}          uv sync
        </pre>
      </Card>

      <Card title="Python 3.8 (Sim Interpreter)">
        <p className="text-sm text-slate-600 mb-2">
          The LimX Windows SDK links against <code className="text-xs bg-slate-100 px-1 rounded">python38.dll</code>.
          Simulations run as child processes under a dedicated Python 3.8 interpreter.
          The one-time setup script auto-downloads and configures it.
        </p>
        <pre className="bg-slate-900 text-green-300 text-xs p-3 rounded font-mono whitespace-pre-wrap">
          .\setup-sim-env.ps1
        </pre>
        <p className="text-xs text-slate-500 mt-2">
          Creates <code className="text-xs bg-slate-100 px-1 rounded">.venv-sim38/</code> with mujoco 3.1.6, numpy 1.24.4, and limxsdk 3.4.2.
        </p>
      </Card>

      <Card title="Git Submodules">
        <p className="text-sm text-slate-600 mb-2">
          Both <code className="text-xs bg-slate-100 px-1 rounded">tron1-mujoco-sim</code> and
          <code className="text-xs bg-slate-100 px-1 rounded">humanoid-mujoco-sim</code> contain
          robot model submodules. These must be initialized for the simulators to find model files.
        </p>
        <pre className="bg-slate-900 text-green-300 text-xs p-3 rounded font-mono whitespace-pre-wrap">
          cd D:\Dev\repos\external\tron1-mujoco-sim{"\n"}          git submodule update --init --recursive{"\n"}{"\n"}          cd D:\Dev\repos\external\humanoid-mujoco-sim{"\n"}          git submodule update --init --recursive
        </pre>
      </Card>

      <Card title="External Repositories">
        <p className="text-sm text-slate-600 mb-2">
          All upstream LimX repos must be cloned to <code className="text-xs bg-slate-100 px-1 rounded">D:\Dev\repos\external\</code>.
          Override the path with the <code className="text-xs bg-slate-100 px-1 rounded">LIMX_EXTERNAL_DIR</code> environment variable.
        </p>
        <p className="text-xs text-slate-500">
          Required: tron1-mujoco-sim, humanoid-mujoco-sim, humanoid-description, limxsdk-lowlevel.
          <br />
          Optional: tron1-rl-isaaclab, tron1-rl-isaacgym, tron1-rl-deploy-python, humanoid-rl-deploy-python,
          tron1-rl-deploy-ros2, humanoid-rl-deploy-ros2, tron1-gazebo-ros2.
        </p>
      </Card>
    </div>
  );
}

const TROUBLES = [
  {
    symptom: "ImportError: No module named mujoco",
    cause: "setup-sim-env.ps1 not run, or LIMX_SIM_PYTHON points to wrong venv",
    fix: "Run .\\setup-sim-env.ps1 from the repo root. Verify with: .venv-sim38\\Scripts\\python.exe -c \"import mujoco\"",
  },
  {
    symptom: "OSError: python38.dll not found",
    cause: "Sim running under MCP's Python (3.11+) instead of the sim interpreter",
    fix: "Check LIMX_SIM_PYTHON env var. Default: .venv-sim38\\Scripts\\python.exe. Ensure this path exists and contains the SDK wheel.",
  },
  {
    symptom: "FileNotFoundError: robot.xml",
    cause: "Submodules not initialized in the sim repo",
    fix: "Run git submodule update --init --recursive in the sim repo (tron1-mujoco-sim or humanoid-mujoco-sim).",
  },
  {
    symptom: "Failed to launch simulator",
    cause: "simulator.py not found — repo not cloned",
    fix: "Clone the repo with --recurse-submodules to the external directory.",
  },
  {
    symptom: "MuJoCo viewer opens and immediately closes",
    cause: "Missing model file or invalid ROBOT_TYPE",
    fix: "Check the log tail via sim_jobs(job_id, log_tail_lines=50). Verify the ROBOT_TYPE is valid with list_robot_variants().",
  },
  {
    symptom: "Process hangs on wait()",
    cause: "MuJoCo viewer window still open (process not terminated)",
    fix: "Close the viewer window or use stop_sim() which sends SIGTERM, then SIGKILL after 5s timeout.",
  },
  {
    symptom: "GLB export fails: trimesh not installed",
    cause: "Missing trimesh package in the server venv",
    fix: "Run: uv pip install trimesh",
  },
  {
    symptom: "Web dashboard shows 'Not Ready'",
    cause: "One or more external repos or submodules are missing",
    fix: "Check the Dashboard cards for red indicators. Ensure all required repos exist and submodules are initialized.",
  },
  {
    symptom: "Policy deploy fails with no controllers",
    cause: "RL deploy repo not cloned or empty controllers/ directory",
    fix: "Clone tron1-rl-deploy-python or humanoid-rl-deploy-python to external/. The controllers/ dir is populated by training.",
  },
  {
    symptom: "ListRobotVariants returns empty list",
    cause: "Submodule not populated — robot-description or humanoid-description is empty",
    fix: "Run git submodule update --init --recursive in the respective sim repo.",
  },
];

function Troubleshooting() {
  return (
    <Card title="Common Issues">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-2 pr-4 font-medium">Symptom</th>
              <th className="pb-2 pr-4 font-medium">Cause</th>
              <th className="pb-2 font-medium">Fix</th>
            </tr>
          </thead>
          <tbody>
            {TROUBLES.map((t, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-2 pr-4 text-xs text-red-700 font-medium align-top">
                  {t.symptom}
                </td>
                <td className="py-2 pr-4 text-xs text-slate-600 align-top">
                  {t.cause}
                </td>
                <td className="py-2 text-xs text-slate-800 font-mono align-top whitespace-pre-wrap">
                  {t.fix}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Architecture() {
  return (
    <div className="space-y-4">
      <Card title="System Architecture">
        <p className="text-sm text-slate-600 mb-4">
          The MCP server acts as an orchestration layer between Claude Desktop / Cursor and
          LimX's upstream robotics repositories. Simulations launch as managed background
          processes because the upstream MuJoCo viewer opens a GUI window and blocks until closed.
        </p>

        <pre className="bg-slate-900 text-green-300 text-xs p-4 rounded font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">
{`Claude Desktop / Cursor
    │
    │  MCP stdio / HTTP
    ▼
┌─────────────────────────────────────────────┐
│         limx-robotics-mcp (FastMCP 3.2)     │
│                                             │
│  start_sim ──► .venv-sim38/python           │
│               tron1-mujoco-sim/simulator.py │
│               [opens MuJoCo viewer window]  │
│                                             │
│  stop_sim/sim_jobs  lifecycle management    │
│                                             │
│  list_robot_variants  scan description dirs │
│  get_robot_description  locate URDF/USD/XML │
│                                             │
│  list_policies  scan controllers/           │
│  run_deployed_policy  deploy RL/VLA policy  │
│                                             │
│  export_model_for_fleet  URDF/STL → GLB     │
│       └──► _exchange/models/limx/*.glb     │
│            └──► godot-mcp / unity3d-mcp    │
│                                             │
│  sim_status  composite health check         │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│         Web Dashboard (:11045)              │
│                                             │
│  Vite + React + Tailwind CSS                │
│  FastAPI backend (:11044)                   │
│  MCP HTTP mount at /mcp                      │
└─────────────────────────────────────────────┘`}
        </pre>
      </Card>

      <Card title="Data Flow">
        <p className="text-sm text-slate-600 mb-2">
          When a simulation starts, the MCP server:
        </p>
        <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
          <li>Validates the platform and robot type against available models</li>
          <li>Spawns the upstream <code className="text-xs bg-slate-100 px-1 rounded">simulator.py</code> as a child process under Python 3.8</li>
          <li>Sets <code className="text-xs bg-slate-100 px-1 rounded">ROBOT_TYPE</code> environment variable for the simulator</li>
          <li>Captures stdout/stderr to a per-job log file in <code className="text-xs bg-slate-100 px-1 rounded">logs/</code></li>
          <li>Returns a <code className="text-xs bg-slate-100 px-1 rounded">job_id</code> immediately for lifecycle management</li>
          <li>The MuJoCo viewer window appears on the desktop (GUI required)</li>
          <li><code className="text-xs bg-slate-100 px-1 rounded">stop_sim</code> terminates the process (SIGTERM + 5s timeout + SIGKILL)</li>
        </ol>
      </Card>

      <Card title="Python Interpreter Split">
        <p className="text-sm text-slate-600 mb-2">
          The project uses two Python interpreters:
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-2 pr-4 font-medium">Interpreter</th>
              <th className="pb-2 pr-4 font-medium">Python</th>
              <th className="pb-2 font-medium">Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4 text-xs font-mono">.venv/</td>
              <td className="py-2 pr-4 text-xs">3.11–3.12</td>
              <td className="py-2 text-xs">MCP server (FastMCP, FastAPI, uvicorn)</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-xs font-mono">.venv-sim38/</td>
              <td className="py-2 pr-4 text-xs">3.8</td>
              <td className="py-2 text-xs">MuJoCo simulations (SDK links python38.dll)</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}

const FOSS_REPOS = [
  {
    name: "tron1-mujoco-sim",
    url: "https://github.com/limxdynamics/tron1-mujoco-sim",
    desc: "TRON 1 MuJoCo simulation with real-time control — primary sim environment",
    lang: "Python",
  },
  {
    name: "humanoid-mujoco-sim",
    url: "https://github.com/limxdynamics/humanoid-mujoco-sim",
    desc: "Oli humanoid MuJoCo simulation — full-size humanoid sim environment",
    lang: "Python",
  },
  {
    name: "humanoid-description",
    url: "https://github.com/limxdynamics/humanoid-description",
    desc: "URDF/USD/XML robot model files for Oli (D03 + D04 generations)",
    lang: "XML",
  },
  {
    name: "limxsdk-lowlevel",
    url: "https://github.com/limxdynamics/limxsdk-lowlevel",
    desc: "C++11 low-level motion control SDK with Python bindings",
    lang: "C++11 / Python",
  },
  {
    name: "tron1-rl-isaaclab",
    url: "https://github.com/limxdynamics/tron1-rl-isaaclab",
    desc: "Isaac Lab RL training environment for TRON 1 (65 stars)",
    lang: "Python",
  },
  {
    name: "tron1-rl-isaacgym",
    url: "https://github.com/limxdynamics/tron1-rl-isaacgym",
    desc: "Isaac Gym GPU-accelerated RL training (most popular — 123 stars)",
    lang: "Python",
  },
  {
    name: "tron1-rl-deploy-python",
    url: "https://github.com/limxdynamics/tron1-rl-deploy-python",
    desc: "Python RL policy deployment pipeline for TRON 1 (27 stars)",
    lang: "Python",
  },
  {
    name: "humanoid-rl-deploy-python",
    url: "https://github.com/limxdynamics/humanoid-rl-deploy-python",
    desc: "Python RL policy deployment pipeline for Oli",
    lang: "Python",
  },
  {
    name: "tron1-rl-deploy-ros2",
    url: "https://github.com/limxdynamics/tron1-rl-deploy-ros2",
    desc: "ROS2-native RL policy deployment for TRON 1",
    lang: "Python / C++",
  },
  {
    name: "humanoid-rl-deploy-ros2",
    url: "https://github.com/limxdynamics/humanoid-rl-deploy-ros2",
    desc: "ROS2-native RL policy deployment for Oli",
    lang: "Python / C++",
  },
  {
    name: "tron1-gazebo-ros2",
    url: "https://github.com/limxdynamics/tron1-gazebo-ros2",
    desc: "Full-physics TRON 1 simulation in Gazebo with ROS2 (8 stars)",
    lang: "Python / C++",
  },
];

function LimxFoss() {
  return (
    <Card title="Upstream Repositories (github.com/limxdynamics/)">
      <p className="text-sm text-slate-600 mb-4">
        All 11 repos use the <strong>Apache 2.0</strong> license. They are cloned to
        <code className="text-xs bg-slate-100 px-1 rounded"> D:\Dev\repos\external\ </code>
        and scraped for robot models, simulation entry points, and policy deployment pipelines.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-2 pr-4 font-medium">Repo</th>
              <th className="pb-2 pr-4 font-medium">Language</th>
              <th className="pb-2 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {FOSS_REPOS.map((r, i) => (
              <tr key={r.name} className="border-b border-slate-100">
                <td className="py-2 pr-4">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {r.name}
                  </a>
                </td>
                <td className="py-2 pr-4 text-xs text-slate-500">{r.lang}</td>
                <td className="py-2 text-xs text-slate-600">{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
