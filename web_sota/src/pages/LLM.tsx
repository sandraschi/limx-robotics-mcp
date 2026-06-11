import { useEffect, useState, useRef } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function LLM() {
  const [providers, setProviders] = useState<string[]>([]);
  const [provider, setProvider] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/llm/providers")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d.providers) ? d.providers : [];
        setProviders(list);
        if (list.length > 0) setProvider(list[0]);
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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">LLM Chat</h1>

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
