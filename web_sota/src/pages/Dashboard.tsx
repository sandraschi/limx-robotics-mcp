import { useEffect, useState } from "react";

type SimJob = {
  job_id: string;
  platform: string;
  robot_type: string;
  pid: number;
  status: string;
  uptime_s: number;
  log_path: string;
};

type Status = {
  ready: boolean;
  repos: Record<string, boolean>;
  running_jobs: SimJob[];
  sim_environment: { deps_ok: boolean; detail: string };
};

export default function Dashboard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchStatus = () => {
    fetch("/api/sim/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch((e) => setErr(String(e)));
  };

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 10000);
    return () => clearInterval(id);
  }, []);

  if (err) return <PageTitle>Error: {err}</PageTitle>;
  if (!status) return <PageTitle>Loading…</PageTitle>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
            status.ready
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              status.ready ? "bg-green-500" : "bg-red-500"
            }`}
          />
          {status.ready ? "Ready" : "Not Ready"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="External Repositories">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 font-medium">Repo</th>
                <th className="pb-2 font-medium">Available</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(status.repos).map(([name, ok]) => (
                <tr key={name} className="border-b border-slate-100">
                  <td className="py-2 font-mono text-xs">{name}</td>
                  <td className="py-2">
                    <span
                      className={
                        ok ? "text-green-600" : "text-red-600"
                      }
                    >
                      {ok ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Sim Environment">
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  status.sim_environment.deps_ok
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              <span className="font-medium">Python 3.8</span>
              <span
                className={
                  status.sim_environment.deps_ok
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {status.sim_environment.deps_ok ? "Ready" : "Not ready"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              {status.sim_environment.detail}
            </p>
          </div>
        </Card>
      </div>

      <Card title={`Running Jobs (${status.running_jobs.length})`}>
        {status.running_jobs.length === 0 ? (
          <p className="text-sm text-slate-400">No active simulations.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 font-medium">Job ID</th>
                <th className="pb-2 font-medium">Platform</th>
                <th className="pb-2 font-medium">Robot</th>
                <th className="pb-2 font-medium">PID</th>
                <th className="pb-2 font-medium">Uptime</th>
              </tr>
            </thead>
            <tbody>
              {status.running_jobs.map((j, i) => (
                <tr
                  key={j.job_id}
                  className={`border-b border-slate-100 text-xs ${
                    i % 2 === 0 ? "bg-white" : "bg-slate-50"
                  }`}
                >
                  <td className="py-2 font-mono">{j.job_id}</td>
                  <td className="py-2">{j.platform}</td>
                  <td className="py-2">{j.robot_type}</td>
                  <td className="py-2 font-mono">{j.pid}</td>
                  <td className="py-2">{j.uptime_s.toFixed(0)}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Quick Actions">
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() =>
              fetch("/api/sim/start", { method: "POST" }).catch(() => {})
            }
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Start Sim
          </button>
          <button
            onClick={() =>
              fetch("/api/sim/stop", { method: "POST" }).catch(() => {})
            }
            className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Stop Sim
          </button>
          <button
            onClick={() =>
              fetch("/api/models/export", { method: "POST" }).catch(() => {})
            }
            className="px-4 py-2 bg-slate-600 text-white rounded text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            Export Model
          </button>
        </div>
      </Card>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 text-lg font-semibold text-slate-900">{children}</div>
  );
}
