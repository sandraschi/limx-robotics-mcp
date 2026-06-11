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

type Variant = string;

export default function Simulations() {
  const [jobs, setJobs] = useState<SimJob[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [platform, setPlatform] = useState("tron1");
  const [robotType, setRobotType] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [logTail, setLogTail] = useState("");
  const [msg, setMsg] = useState("");

  const [aiModal, setAiModal] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");

  const fetchJobs = () => {
    fetch("/api/sim/jobs")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d?.jobs) ? d.jobs : [];
        setJobs(list);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch("/api/models/variants")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d.variants) ? d.variants : [];
        setVariants(list);
        if (list.length > 0) setRobotType(list[0]);
      })
      .catch(() => {});
    fetchJobs();
    const id = setInterval(fetchJobs, 5000);
    return () => clearInterval(id);
  }, []);

  const startSim = () => {
    setMsg("");
    fetch("/api/sim/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, robot_type: robotType }),
    })
      .then((r) => r.json())
      .then((d) => {
        setMsg(d.message || d.job_id || "Started");
        fetchJobs();
      })
      .catch((e) => setMsg(String(e)));
  };

  const stopSim = (jobId: string) => {
    fetch("/api/sim/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId }),
    })
      .then(() => fetchJobs())
      .catch(() => {});
  };

  const toggleExpand = (jobId: string) => {
    if (expanded === jobId) {
      setExpanded(null);
      setLogTail("");
      return;
    }
    setExpanded(jobId);
    setLogTail("Loading…");
    fetch(`/api/sim/jobs?job_id=${jobId}&log_tail_lines=100`)
      .then((r) => r.json())
      .then((d) => setLogTail(d.log_tail ?? d.log ?? "(no log)"))
      .catch((e) => setLogTail(String(e)));
  };

  const analyzeJob = async (jobId: string) => {
    setAiModal(jobId);
    setAiLoading(true);
    setAiResult("");
    try {
      const r = await fetch("/api/ai/analyze-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });
      const d = await r.json();
      setAiResult(d.analysis ?? d.message ?? JSON.stringify(d));
    } catch (e: any) {
      setAiResult(`Error: ${e}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Simulations</h1>

      {msg && (
        <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          {msg}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
          Start New Simulation
        </h2>
        <div className="flex items-end gap-4 flex-wrap">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-500 font-medium">Platform</span>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="border border-slate-300 rounded px-3 py-2 text-sm bg-white"
            >
              <option value="tron1">tron1</option>
              <option value="oli">oli</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-500 font-medium">Robot Type</span>
            <select
              value={robotType}
              onChange={(e) => setRobotType(e.target.value)}
              className="border border-slate-300 rounded px-3 py-2 text-sm bg-white"
            >
              {variants.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={startSim}
            className="px-5 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Start
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
          Running Jobs ({jobs.length})
        </h2>
        {jobs.length === 0 ? (
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
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j, i) => (
                <>
                  <tr
                    key={j.job_id}
                    onClick={() => toggleExpand(j.job_id)}
                    className={`border-b border-slate-100 text-xs cursor-pointer ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50"
                    } hover:bg-slate-100 transition-colors`}
                  >
                    <td className="py-2 font-mono">{j.job_id}</td>
                    <td className="py-2">{j.platform}</td>
                    <td className="py-2">{j.robot_type}</td>
                    <td className="py-2 font-mono">{j.pid}</td>
                    <td className="py-2">{j.uptime_s.toFixed(0)}s</td>
                    <td className="py-2 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          analyzeJob(j.job_id);
                        }}
                        className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium hover:bg-emerald-200 transition-colors"
                      >
                        AI Analyze
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          stopSim(j.job_id);
                        }}
                        className="px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                      >
                        Stop
                      </button>
                    </td>
                  </tr>
                  {expanded === j.job_id && (
                    <tr key={`${j.job_id}-log`}>
                      <td colSpan={6} className="p-0">
                        <pre className="bg-slate-900 text-green-300 text-xs p-4 max-h-64 overflow-auto font-mono leading-relaxed whitespace-pre-wrap">
                          {logTail}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {aiModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-700">
                AI Analysis — {aiModal}
              </h2>
              <button
                onClick={() => { setAiModal(null); setAiResult(""); }}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-5 overflow-auto flex-1">
              {aiLoading ? (
                <p className="text-sm text-slate-400">Analyzing…</p>
              ) : (
                <pre className="text-sm whitespace-pre-wrap leading-relaxed font-sans">
                  {aiResult}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
