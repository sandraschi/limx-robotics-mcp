import { useEffect, useState } from "react";

export default function Models() {
  const [platform, setPlatform] = useState("tron1");
  const [variants, setVariants] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [exportMsg, setExportMsg] = useState("");
  const [depot, setDepot] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/models/variants?platform=${platform}`)
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d.variants) ? d.variants : [];
        setVariants(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch(() => {});
  }, [platform]);

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/models/descriptions?platform=${platform}&variant=${selected}`)
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d.files) ? d.files : [];
        setDescriptions(list);
      })
      .catch(() => setDescriptions([]));
  }, [platform, selected]);

  useEffect(() => {
    fetch("/api/models/depot")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d.files) ? d.files : [];
        setDepot(list);
      })
      .catch(() => {});
  }, []);

  const doExport = () => {
    setExportMsg("");
    fetch("/api/models/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, variant: selected }),
    })
      .then((r) => r.json())
      .then((d) => {
        setExportMsg(d.path || d.message || JSON.stringify(d));
      })
      .catch((e) => setExportMsg(String(e)));
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Models</h1>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
          Robot Variants
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

        <div className="flex flex-wrap gap-2 mb-4">
            {variants.map((v, idx) => (
            <button
              key={typeof v === 'string' ? v : `v-${idx}`}
              onClick={() => setSelected(v)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                selected === v
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {selected && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-600">
              Description Files — {selected}
            </h3>
            {descriptions.length === 0 ? (
              <p className="text-xs text-slate-400">No description files.</p>
            ) : (
              <ul className="space-y-1">
                {descriptions.map((f, idx) => (
                  <li
                    key={typeof f === 'string' ? f : f?.path || `desc-${idx}`}
                    className="text-xs font-mono text-slate-600 bg-slate-50 px-3 py-1.5 rounded"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            )}

            <button
              onClick={doExport}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Export as GLB
            </button>
            {exportMsg && (
              <div className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded font-mono">
                {exportMsg}
                <p className="text-green-600 mt-1">
                  Import hint: Use godot_import_glb or unity3d-mcp to load.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
          Export Depot
        </h2>
        {depot.length === 0 ? (
          <p className="text-sm text-slate-400">No exported models yet.</p>
        ) : (
          <ul className="space-y-1">
            {depot.map((f, idx) => (
              <li
                key={typeof f === 'string' ? f : f?.name || `depot-${idx}`}
                className="text-xs font-mono text-slate-600 bg-slate-50 px-3 py-1.5 rounded"
              >
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
