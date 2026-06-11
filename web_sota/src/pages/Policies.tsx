import { useEffect, useState } from "react";

type Policy = {
  name: string;
  robot_type: string;
  path: string;
};

export default function Policies() {
  const [platform, setPlatform] = useState("tron1");
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState("");
  const [robotType, setRobotType] = useState("");
  const [result, setResult] = useState<{
    exit_code: number;
    log: string;
  } | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch(`/api/policies?platform=${platform}`)
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d.policies) ? d.policies : [];
        setPolicies(list);
        if (list.length > 0) {
          setSelectedPolicy(list[0].name);
          setRobotType(list[0].robot_type);
        }
      })
      .catch(() => {});
  }, [platform]);

  const runPolicy = () => {
    setRunning(true);
    setResult(null);
    fetch("/api/policies/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        policy: selectedPolicy,
        robot_type: robotType,
        platform,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        setResult({
          exit_code: d.exit_code ?? 0,
          log: d.log ?? d.message ?? "(no output)",
        });
      })
      .catch((e) =>
        setResult({ exit_code: -1, log: String(e) })
      )
      .finally(() => setRunning(false));
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Policies</h1>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
          Available Policies
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-500 font-medium">Platform</span>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="border border-slate-300 rounded px-3 py-2 bg-white"
            >
              <option value="tron1">tron1</option>
              <option value="oli">oli</option>
            </select>
          </label>
        </div>

        {policies.length === 0 ? (
          <p className="text-sm text-slate-400">No policies found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Robot Type</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((p, i) => (
                  <tr
                    key={p.name}
                    className={`border-b border-slate-100 text-xs ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50"
                    }`}
                  >
                    <td className="py-2 font-mono">{p.name}</td>
                    <td className="py-2">{p.robot_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
          Run Policy
        </h2>
        <div className="flex items-end gap-4 flex-wrap">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-500 font-medium">Policy</span>
            <select
              value={selectedPolicy}
              onChange={(e) => setSelectedPolicy(e.target.value)}
              className="border border-slate-300 rounded px-3 py-2 bg-white min-w-[180px]"
            >
              {policies.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-500 font-medium">Robot Type</span>
            <input
              type="text"
              value={robotType}
              onChange={(e) => setRobotType(e.target.value)}
              className="border border-slate-300 rounded px-3 py-2 text-sm"
            />
          </label>
          <button
            onClick={runPolicy}
            disabled={running}
            className="px-5 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {running ? "Running…" : "Run"}
          </button>
        </div>

        {result && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Exit Code:</span>
              <span
                className={
                  result.exit_code === 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {result.exit_code}
              </span>
            </div>
            <pre className="bg-slate-900 text-green-300 text-xs p-4 rounded max-h-64 overflow-auto font-mono leading-relaxed whitespace-pre-wrap">
              {result.log}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
