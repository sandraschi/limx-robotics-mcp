import { useEffect, useState } from "react";

type Settings = {
  LIMX_EXTERNAL_DIR: string;
  LIMX_LOG_DIR: string;
  LIMX_SIM_PYTHON: string;
  [key: string]: string;
};

export default function Settings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const [providers, setProviders] = useState<Record<string, any[]>>({});
  const [selectedProvider, setSelectedProvider] = useState("ollama");
  const [selectedModel, setSelectedModel] = useState("");
  const [testResult, setTestResult] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings ?? d);
      })
      .catch((e) =>
        setToast({ type: "error", msg: String(e) })
      );
  }, []);

  useEffect(() => {
    fetch("/api/llm/providers")
      .then((r) => r.json())
      .then((d) => {
        setProviders(d);
        if (d.ollama?.length) {
          const saved = localStorage.getItem("llm_provider") || "ollama";
          const savedModel = localStorage.getItem("llm_model") || d.ollama[0]?.name || "llama3.2:3b";
          setSelectedProvider(saved);
          setSelectedModel(savedModel);
        }
      })
      .catch(() => setProviders({ ollama: [{name:"llama3.2:3b"}] }));
  }, []);

  const saveLlmConfig = (provider: string, model: string) => {
    setSelectedProvider(provider);
    setSelectedModel(model);
    localStorage.setItem("llm_provider", provider);
    localStorage.setItem("llm_model", model);
  };

  const testConnection = async () => {
    setTestResult("Testing...");
    try {
      const r = await fetch("/api/llm/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider, model: selectedModel, prompt: "Hello, respond with just: OK" }),
      });
      const data = await r.json();
      setTestResult(data.response ? "Connected" : "Failed: " + (data.error || "no response"));
    } catch (e) {
      setTestResult("Error: " + String(e));
    }
  };

  const update = (key: string, value: string) => {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
    setDirty(true);
  };

  const save = () => {
    if (!settings) return;
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setDirty(false);
        setToast({ type: "success", msg: d.message || "Settings saved." });
      })
      .catch((e) => setToast({ type: "error", msg: String(e) }));
  };

  const keyLabels: Record<string, string> = {
    LIMX_EXTERNAL_DIR: "External Repositories Directory",
    LIMX_LOG_DIR: "Log Directory",
    LIMX_SIM_PYTHON: "Sim Python Path",
  };

  const editableKeys = [
    "LIMX_EXTERNAL_DIR",
    "LIMX_LOG_DIR",
    "LIMX_SIM_PYTHON",
  ];

  const providerModels = providers[selectedProvider] || providers["ollama"] || [];
  const providerReachable = providers[selectedProvider] ? true : false;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      {toast && (
        <div
          className={`px-4 py-2 rounded text-sm ${
            toast.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {toast.msg}
          <button
            onClick={() => setToast(null)}
            className="ml-3 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
        {!settings ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(settings).map(([key, value]) => (
              <label
                key={key}
                className="flex flex-col gap-1 text-sm"
              >
                <span className="text-slate-500 font-medium">
                  {keyLabels[key] || key}
                </span>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => update(key, e.target.value)}
                  readOnly={!editableKeys.includes(key)}
                  className={`border rounded px-3 py-2 text-sm font-mono ${
                    editableKeys.includes(key)
                      ? "border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      : "border-transparent bg-slate-50 text-slate-500 cursor-default"
                  }`}
                />
              </label>
            ))}

            <div className="pt-2">
              <button
                onClick={save}
                disabled={!dirty}
                className="px-5 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Save Changes
              </button>
              {!dirty && (
                <span className="ml-3 text-xs text-slate-400">
                  No unsaved changes
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Local LLM</h2>
        <p className="text-xs text-slate-500">Select which local LLM provider and model to use for AI tools.</p>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-500 font-medium">Provider</span>
            <select
              value={selectedProvider}
              onChange={(e) => {
                const p = e.target.value;
                const models = providers[p] || [];
                const m = models[0]?.name || "llama3.2:3b";
                saveLlmConfig(p, m);
              }}
              className="border border-slate-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(providers).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-500 font-medium">Model</span>
            <select
              value={selectedModel}
              onChange={(e) => saveLlmConfig(selectedProvider, e.target.value)}
              className="border border-slate-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {providerModels.map((m: any) => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className={`w-2 h-2 rounded-full ${providerReachable ? "bg-green-500" : "bg-red-500"}`} />
            {selectedProvider}
          </span>
          <button
            onClick={testConnection}
            className="text-xs px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50"
          >
            Test Connection
          </button>
          {testResult && (
            <span className={`text-xs ${testResult === "Connected" ? "text-green-600" : "text-yellow-600"}`}>
              {testResult}
            </span>
          )}
        </div>

        <div className="text-xs text-slate-400">
          The LLM page uses these settings. Changes are saved to localStorage and persist across sessions.
        </div>
      </div>
    </div>
  );
}
