import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Simulations from "./pages/Simulations";
import Models from "./pages/Models";
import Policies from "./pages/Policies";
import Logging from "./pages/Logging";
import LLM from "./pages/LLM";
import Settings from "./pages/Settings";
import Help from "./pages/Help";

const nav = [
  { to: "/", label: "Dashboard", icon: "◉" },
  { to: "/simulations", label: "Simulations", icon: "▶" },
  { to: "/models", label: "Models", icon: "■" },
  { to: "/policies", label: "Policies", icon: "⚙" },
  { to: "/logging", label: "Logging", icon: "≡" },
  { to: "/llm", label: "LLM", icon: "◈" },
  { to: "/settings", label: "Settings", icon: "⚡" },
  { to: "/help", label: "Help", icon: "?" },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen">
        <aside className="w-56 bg-slate-900 text-slate-100 flex flex-col shrink-0">
          <div className="px-5 py-5 border-b border-slate-700">
            <h1 className="text-base font-bold tracking-tight">limx-robotics-mcp</h1>
            <p className="text-xs text-slate-400 mt-0.5">Fleet Dashboard</p>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {nav.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-700 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <span className="w-5 text-center">{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="px-5 py-4 border-t border-slate-700 text-xs text-slate-500">
            v0.1.0 — 11045
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/simulations" element={<Simulations />} />
            <Route path="/models" element={<Models />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/logging" element={<Logging />} />
            <Route path="/llm" element={<LLM />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
