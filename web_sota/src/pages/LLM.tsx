import { useEffect, useState, useRef } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type QuickAction = "idle" | "loading" | "prompt" | "done";

export default function LLM() {
  const [providers, setProviders] = useState<string[]>([]);
  const [provider, setProvider] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [workflowState, setWorkflowState] = useState<QuickAction>("idle");
  const [workflowGoal, setWorkflowGoal] = useState("");
  const [nlState, setNlState] = useState<QuickAction>("idle");
  const [nlPrompt, setNlPrompt] = useState("");
  const [nlJobId, setNlJobId] = useState("");
  const [result, setResult] = useState("");
  const [jobs, setJobs] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/llm/providers")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d.providers) ? d.providers : [];
        setProviders(list);
        if (list.length > 0) setProvider(list[0]);
      })
      .catch(() => {});
    fetch("/api/sim/jobs")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d?.jobs) ? d.jobs.map((j: any) => j.job_id) : [];
        setJobs(list);
        if (list.length > 0) setNlJobId(list[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!provider) return;
    fetch(`/api/llm/models?provider=${provider}`)
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d.models) ? d.models : [];
        setModels(list);
        if (list.length > 0) setModel(list[0]);
      })
      .catch(() => {});
  }, [provider]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    fetch("/api/llm/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        model,
        messages: [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        const reply = d.response ?? d.message ?? d.content ?? "(no response)";
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
      })
      .catch((e) => {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: `Error: ${e}` },
        ]);
      })
      .finally(() => setLoading(false));
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const analyzeState = async () => {
    const targets = jobs.length > 0 ? [jobs[0]] : [];
    if (targets.length === 0) return;
    setResult("");
    setWorkflowState("loading");
    setWorkflowState("done");
    const r = await fetch("/api/ai/analyze-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: targets[0] }),
    });
    const d = await r.json();
    setResult(d.analysis ?? d.message ?? JSON.stringify(d));
  };

  const runWorkflow = async () => {
    if (!workflowGoal.trim()) return;
    setResult("");
    setWorkflowState("loading");
    const r = await fetch("/api/ai/workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: workflowGoal }),
    });
    const d = await r.json();
    setResult(d.plan_and_result ?? d.message ?? JSON.stringify(d));
    setWorkflowState("done");
  };

  const runNLControl = async () => {
    if (!nlPrompt.trim() || !nlJobId) return;
    setResult("");
    setNlState("loading");
    const r = await fetch("/api/ai/nl-control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: nlPrompt, job_id: nlJobId }),
    });
    const d = await r.json();
    setResult(JSON.stringify(d.controls ?? d, null, 2));
    setNlState("done");
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">LLM & AI Workflows</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          title="Analyze Robot State"
          description="Analyze the current state of the first running simulation"
          busy={workflowState === "loading"}
          onClick={analyzeState}
        />
        <QuickActionCard
          title="Run Sim Workflow"
          description="Execute a multi-step agentic simulation workflow"
          busy={workflowState === "loading"}
          onClick={() => setWorkflowState("prompt")}
        />
        <QuickActionCard
          title="Natural Language Control"
          description="Send a natural language command to a running sim"
          busy={nlState === "loading"}
          onClick={() => setNlState("prompt")}
        />
      </div>

      {workflowState === "prompt" && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Run Sim Workflow
          </h2>
          <input
            type="text"
            value={workflowGoal}
            onChange={(e) => setWorkflowGoal(e.target.value)}
            placeholder="Describe what you want the robot to do..."
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={runWorkflow}
            disabled={!workflowGoal.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Execute Workflow
          </button>
        </div>
      )}

      {nlState === "prompt" && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Natural Language Control
          </h2>
          <div className="flex gap-3 items-end">
            <label className="flex flex-col gap-1 text-sm flex-1">
              <span className="text-slate-500 font-medium">Job ID</span>
              <select
                value={nlJobId}
                onChange={(e) => setNlJobId(e.target.value)}
                className="border border-slate-300 rounded px-3 py-2 text-sm bg-white"
              >
                {jobs.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm flex-[3]">
              <span className="text-slate-500 font-medium">Command</span>
              <input
                type="text"
                value={nlPrompt}
                onChange={(e) => setNlPrompt(e.target.value)}
                placeholder="e.g. bend the right knee 30 degrees"
                className="border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <button
              onClick={runNLControl}
              disabled={!nlPrompt.trim() || !nlJobId}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
            Result
          </h2>
          <pre className="bg-slate-50 border border-slate-200 rounded p-4 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-96">
            {result}
          </pre>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-500 font-medium">Provider</span>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="border border-slate-300 rounded px-3 py-2 bg-white"
          >
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-500 font-medium">Model</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="border border-slate-300 rounded px-3 py-2 bg-white min-w-[160px]"
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col">
        <div
          className="p-4 space-y-3 overflow-auto"
          style={{ minHeight: 300, maxHeight: 500 }}
        >
          {messages.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">
              Send a message to start chatting.
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                <pre className="font-sans whitespace-pre-wrap break-words m-0">
                  {msg.content}
                </pre>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-lg px-4 py-2 text-sm text-slate-400">
                Thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-200 p-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message…"
            disabled={loading}
            className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  busy,
  onClick,
}: {
  title: string;
  description: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 text-left hover:border-blue-300 hover:shadow-md transition-all disabled:opacity-50"
    >
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
        {busy ? "Processing…" : description}
      </p>
    </button>
  );
}
