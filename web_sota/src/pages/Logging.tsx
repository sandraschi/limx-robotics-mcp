import { useEffect, useRef, useState } from "react";

export default function Logging() {
  const [level, setLevel] = useState("INFO");
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchLogs = () => {
    const params = new URLSearchParams({ level });
    if (search) params.set("search", search);
    if (selectedFile) params.set("file", selectedFile);
    fetch(`/api/logs?${params}`)
      .then((r) => r.json())
      .then((d) => {
        const lines = d.lines ?? d.log ?? [];
        setLogs(Array.isArray(lines) ? lines : [String(lines)]);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch("/api/logs/files")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d.files) ? d.files : [];
        setFiles(list);
        if (list.length > 0) setSelectedFile(list[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchLogs();
    const id = setInterval(fetchLogs, 3000);
    return () => clearInterval(id);
  }, [level, search, selectedFile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const levelColor = (line: string) => {
    if (line.includes("ERROR") || line.includes("CRITICAL"))
      return "text-red-400";
    if (line.includes("WARN") || line.includes("WARNING"))
      return "text-yellow-400";
    if (line.includes("DEBUG")) return "text-blue-400";
    return "text-green-300";
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Logging</h1>

      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-500 font-medium">Level</span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="border border-slate-300 rounded px-3 py-2 bg-white text-sm"
          >
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="DEBUG">DEBUG</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm flex-1 max-w-xs">
          <span className="text-slate-500 font-medium">Search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter log lines…"
            className="border border-slate-300 rounded px-3 py-2 text-sm"
          />
        </label>

        {files.length > 0 && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-500 font-medium">File</span>
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="border border-slate-300 rounded px-3 py-2 bg-white text-sm max-w-[240px]"
            >
            {files.map((f, idx) => {
                const name = typeof f === 'string' ? f : f?.name || `file-${idx}`;
                return <option key={name} value={name}>{name}</option>;
            })}
            </select>
          </label>
        )}
      </div>

      <div className="bg-slate-900 rounded-lg border border-slate-700 p-4">
        <div
          className="overflow-auto font-mono text-xs leading-relaxed whitespace-pre-wrap"
          style={{ maxHeight: "65vh" }}
        >
          {logs.length === 0 ? (
            <span className="text-slate-500">(no log output)</span>
          ) : (
            logs.map((line, i) => (
              <div key={i} className={levelColor(line)}>
                {line}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
