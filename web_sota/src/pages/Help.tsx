import { useState } from "react";

const TABS = ["Overview", "Tools", "Setup", "Troubleshooting"];

const TOOLS = [
  { name: "sim_status", desc: "Composite health check (env, submodules, GPU)", group: "Core Sim" },
  { name: "start_sim", desc: "Launch MuJoCo sim (TRON 1 or Oli MuJoCo)", group: "Core Sim" },
  { name: "stop_sim", desc: "Terminate a running sim by job_id", group: "Core Sim" },
  { name: "sim_jobs", desc: "List/query active and completed sim jobs", group: "Core Sim" },
  { name: "list_robot_variants", desc: "Discover available robot model variants", group: "Core Sim" },
  { name: "get_robot_description", desc: "Get URDF/USD/XML model file content", group: "Core Sim" },
  { name: "list_policies", desc: "List available RL/VLA policies", group: "Core Sim" },
  { name: "run_deployed_policy", desc: "Deploy a trained RL policy to a sim", group: "Core Sim" },
  { name: "export_model_for_fleet", desc: "Export robot as GLB for Godot/Unity", group: "Core Sim" },
  { name: "agentic_sim_workflow", desc: "Autonomous multi-step sim via LLM", group: "AI Workflow" },
  { name: "natural_language_control", desc: "Make it crouch → actuator values", group: "AI Workflow" },
  { name: "analyze_sim_state", desc: "LLM describes robot behaviour from state", group: "AI Workflow" },
  { name: "analyze_sim_logs", desc: "LLM diagnoses issues from sim logs", group: "AI Workflow" },
  { name: "discover_model", desc: "LLM generates URLs, downloads MJCF models", group: "AI Workflow" },
];

const TROUBLES = [
  { symptom: "ImportError: No module named mujoco", cause: "setup-sim-env.ps1 not run, or LIMX_SIM_PYTHON points to wrong venv", fix: "Run .\\setup-sim-env.ps1 from the repo root. Verify: .venv-sim38\\Scripts\\python.exe -c \"import mujoco\"" },
  { symptom: "OSError: python38.dll not found", cause: "Sim running under MCP's Python (3.11+) instead of sim interpreter", fix: "Check LIMX_SIM_PYTHON env var. Default: .venv-sim38\\Scripts\\python.exe. Must point to Python 3.8." },
  { symptom: "FileNotFoundError: robot.xml", cause: "Submodules not initialized in upstream sim repo", fix: "git submodule update --init --recursive in tron1-mujoco-sim or humanoid-mujoco-sim." },
  { symptom: "Failed to launch simulator", cause: "simulator.py not found — repo not cloned", fix: "Clone upstream repos with --recurse-submodules to the external directory." },
  { symptom: "MuJoCo viewer opens and immediately closes", cause: "Missing model file or invalid ROBOT_TYPE", fix: "Check the log via sim_jobs(job_id, log_tail_lines=50). Verify ROBOT_TYPE with list_robot_variants()." },
  { symptom: "Process hangs on wait()", cause: "MuJoCo viewer window still open", fix: "Close the viewer window or use stop_sim() which sends SIGTERM then SIGKILL after 5s." },
  { symptom: "GLB export fails: trimesh not installed", cause: "Missing trimesh package in server venv", fix: "Run: uv pip install trimesh" },
  { symptom: "Web dashboard shows Not Ready", cause: "One or more external repos or submodules missing", fix: "Check Dashboard cards for red indicators. Ensure all required repos exist." },
  { symptom: "Policy deploy fails with no controllers", cause: "RL deploy repo not cloned or empty controllers/", fix: "Clone tron1-rl-deploy-python or humanoid-rl-deploy-python to external/. Controllers dir populated by training." },
  { symptom: "list_robot_variants returns empty", cause: "Submodule not populated", fix: "Run git submodule update --init --recursive in the respective sim repo." },
];

export default function Help() {
  const [tab, setTab] = useState(0);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Help</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === i ? "bg-blue-600 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-100"}`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 0 && <Overview />}
      {tab === 1 && <Tools />}
      {tab === 2 && <Setup />}
      {tab === 3 && <Troubleshooting />}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-4">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Overview() {
  return (
    <div className="space-y-4">
      <Card title="What It Is">
        <p className="text-sm text-slate-600 mb-2">
          <strong>limx-robotics-mcp</strong> is a FastMCP 3.2 wrapper for LimX Dynamics' open-source robotics
          stack — TRON 1 biped and Oli humanoid. Run MuJoCo simulations, deploy VLA policies, and
          visualize robots in Godot/Unity — no hardware required.
        </p>
        <p className="text-sm text-slate-600">
          The MCP server orchestrates LimX's upstream repos. Simulations launch as managed background
          processes under a dedicated <strong>Python 3.8</strong> interpreter (the LimX SDK links
          <code className="text-xs bg-slate-100 px-1 rounded"> python38.dll</code>). The server itself runs on Python 3.11+.
        </p>
      </Card>

      <Card title="Architecture">
        <pre className="bg-slate-900 text-green-300 text-xs p-4 rounded font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto mb-3">
{`Claude Desktop / Cursor
    │  MCP stdio / HTTP
    ▼
limx-robotics-mcp (FastMCP 3.2) ──┬── start_sim → .venv-sim38/python simulator.py
    │                             ├── list_policies → tron1-rl-deploy-python
    │                             └── export_model → _exchange/models/limx/*.glb
    │                                                  → godot-mcp / unity3d-mcp
    ▼
Web Dashboard (Vite + React, :11045)
    └── backend (FastAPI, :11044)`}
        </pre>
        <p className="text-sm text-slate-600"><strong>Two Python interpreters:</strong> Server on 3.11–3.12 (FastMCP, FastAPI), sim on Python 3.8 (MuJoCo + LimX SDK).</p>
      </Card>

      <Card title="Ports">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-2 pr-4 font-medium">Port</th>
              <th className="pb-2 font-medium">Service</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4 text-xs font-mono">11044</td>
              <td className="py-2 text-xs text-slate-600">FastAPI backend + MCP HTTP</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-xs font-mono">11045</td>
              <td className="py-2 text-xs text-slate-600">Vite React frontend (dev)</td>
            </tr>
          </tbody>
        </table>
      </Card>

      <Card title="Supported Platforms">
        <div className="flex gap-2 flex-wrap">
          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-mono">TRON 1 (PF_TRON1A)</span>
          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-mono">TRON 1 (SF_TRON1A)</span>
          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-mono">TRON 1 (WF_TRON1A)</span>
          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-mono">Oli (HU_D03_03)</span>
          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-mono">Oli (HU_D04_01)</span>
        </div>
      </Card>

      <Card title="Badges">
        <div className="flex gap-2 flex-wrap">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">Python 3.11+ / 3.8</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">MuJoCo 3.1.6</span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">14 tools</span>
          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">Apache 2.0</span>
        </div>
      </Card>
    </div>
  );
}

function Tools() {
  const sim = TOOLS.filter((t) => t.group === "Core Sim");
  const ai = TOOLS.filter((t) => t.group === "AI Workflow");
  return (
    <div className="space-y-4">
      <Card title="Core Simulation Tools (9)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 pr-4 font-medium">Tool</th>
                <th className="pb-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {sim.map((t) => (
                <tr key={t.name} className="border-b border-slate-100">
                  <td className="py-2 pr-4 text-xs font-mono text-blue-700 whitespace-nowrap">{t.name}</td>
                  <td className="py-2 text-xs text-slate-600">{t.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="AI Workflow Tools (5)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 pr-4 font-medium">Tool</th>
                <th className="pb-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {ai.map((t) => (
                <tr key={t.name} className="border-b border-slate-100">
                  <td className="py-2 pr-4 text-xs font-mono text-blue-700 whitespace-nowrap">{t.name}</td>
                  <td className="py-2 text-xs text-slate-600">{t.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-3">Full reference: <code className="text-xs bg-slate-100 px-1 rounded">docs/SIM_SETUP.md</code> and <code className="text-xs bg-slate-100 px-1 rounded">docs/LIMX_FOSS.md</code> in the repo.</p>
      </Card>
    </div>
  );
}

function Setup() {
  return (
    <div className="space-y-4">
      <Card title="Prerequisites">
        <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
          <li><strong>Python 3.11–3.12</strong> — for the MCP server (FastMCP requirement)</li>
          <li><strong>Python 3.8</strong> — for the sim interpreter (SDK links python38.dll)</li>
          <li><strong>MuJoCo 3.1.6</strong> — installed in the sim venv</li>
          <li><strong>Git</strong> — with submodule support</li>
          <li><strong>uv</strong> (recommended) — <code className="text-xs bg-slate-100 px-1 rounded">pip install uv</code></li>
          <li><strong>Node.js 20+</strong> — for the web dashboard</li>
          <li><strong>Upstream repos</strong> — cloned to <code className="text-xs bg-slate-100 px-1 rounded">D:\Dev\repos\external\</code></li>
        </ul>
      </Card>

      <Card title="Quick Install">
        <pre className="bg-slate-900 text-green-300 text-xs p-3 rounded font-mono whitespace-pre-wrap">
{`# 1. Init submodules in upstream sim repos
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
.\start.ps1`}
        </pre>
      </Card>

      <Card title="Configuration">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 pr-4 font-medium">Variable</th>
                <th className="pb-2 pr-4 font-medium">Default</th>
                <th className="pb-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-4 text-xs font-mono">LIMX_EXTERNAL_DIR</td>
                <td className="py-2 pr-4 text-xs text-slate-500">D:/Dev/repos/external</td>
                <td className="py-2 text-xs text-slate-600">Directory with all upstream LimX repos</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-4 text-xs font-mono">LIMX_SIM_PYTHON</td>
                <td className="py-2 pr-4 text-xs text-slate-500">.venv-sim38/Scripts/python.exe</td>
                <td className="py-2 text-xs text-slate-600">Python 3.8 interpreter for sim processes</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-4 text-xs font-mono">LIMX_LOG_DIR</td>
                <td className="py-2 pr-4 text-xs text-slate-500">./logs/</td>
                <td className="py-2 text-xs text-slate-600">Simulation log output directory</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-xs font-mono">OLLAMA_URL</td>
                <td className="py-2 pr-4 text-xs text-slate-500">http://localhost:11434</td>
                <td className="py-2 text-xs text-slate-600">Ollama for AI tool fallback</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Development Commands">
        <pre className="bg-slate-900 text-green-300 text-xs p-3 rounded font-mono whitespace-pre-wrap">
{`just lint        # ruff check
just fix         # ruff --fix
just serve       # start MCP server (stdio)
just web         # start web dashboard
just submodules  # init upstream git submodules`}
        </pre>
      </Card>
    </div>
  );
}

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
                <td className="py-2 pr-4 text-xs text-red-700 font-medium align-top">{t.symptom}</td>
                <td className="py-2 pr-4 text-xs text-slate-600 align-top">{t.cause}</td>
                <td className="py-2 text-xs text-slate-800 font-mono align-top whitespace-pre-wrap">{t.fix}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 p-3 bg-slate-50 rounded text-xs text-slate-600">
        <p className="mb-1"><strong>Log files:</strong> Per-simulation log in <code className="text-xs bg-slate-100 px-1 rounded">logs/&lt;job_id&gt;.log</code></p>
        <p className="mb-1"><strong>Reset:</strong> Re-run <code className="text-xs bg-slate-100 px-1 rounded">.\setup-sim-env.ps1</code> and <code className="text-xs bg-slate-100 px-1 rounded">git submodule update --init --recursive</code> in sim repos</p>
      </div>
    </Card>
  );
}
