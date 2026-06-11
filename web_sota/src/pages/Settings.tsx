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
    </div>
  );
}
