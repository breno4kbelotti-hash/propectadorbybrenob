import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, ImagePlus, Mic, Square, Download, Loader2, Sparkles, Eye, Code2, X, Share2, Rocket, Check } from "lucide-react";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/builder")({
  component: Builder,
  validateSearch: (s: Record<string, unknown>) => ({
    name: typeof s.name === "string" ? s.name : undefined,
    phone: typeof s.phone === "string" ? s.phone : undefined,
    segment: typeof s.segment === "string" ? s.segment : undefined,
  }),
});

type Msg = {
  role: "user" | "assistant";
  content: string;
  images?: string[];
  audio?: { data: string; format: string } | null;
};

function extractHtml(text: string): string | null {
  const m = text.match(/```html\s*([\s\S]*?)```/i);
  if (m) return m[1].trim();
  // fallback: um único bloco <!DOCTYPE ... </html>
  const m2 = text.match(/<!DOCTYPE[\s\S]*<\/html>/i);
  return m2 ? m2[0] : null;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
  return dataUrl.split(",")[1] ?? "";
}

function Builder() {
  const { name, phone, segment } = Route.useSearch();
  const { addHistory, updateHistory } = useSettings();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [audio, setAudio] = useState<{ data: string; format: string } | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [preview, setPreview] = useState<"preview" | "code">("preview");
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [published, setPublished] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const latestHtml = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        const h = extractHtml(messages[i].content);
        if (h) return h;
      }
    }
    return null;
  })();

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Salva/atualiza no histórico conforme a IA gera o HTML
  useEffect(() => {
    if (!latestHtml || streaming) return;
    const siteName = name ?? "Site sem nome";
    if (historyId) {
      updateHistory(historyId, { html: latestHtml, name: siteName });
    } else {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setHistoryId(id);
      addHistory({ id, name: siteName, html: latestHtml, createdAt: Date.now() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestHtml, streaming]);

  // Pré-preenche a primeira mensagem quando vier de um card
  useEffect(() => {
    if (name && !input && messages.length === 0) {
      const parts = [`Crie um site profissional para "${name}"`];
      if (segment) parts.push(`(${segment})`);
      if (phone) parts.push(`. Telefone/WhatsApp: ${phone}`);
      parts.push(". Use cores modernas, layout responsivo e uma seção de contato com botão de WhatsApp.");
      setInput(parts.join(""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, phone, segment]);

  async function handleImageInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const urls = await Promise.all(files.map(fileToDataUrl));
    setImages((prev) => [...prev, ...urls].slice(0, 4));
    e.target.value = "";
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      rec.ondataavailable = (ev) => { if (ev.data.size) chunksRef.current.push(ev.data); };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const data = await blobToBase64(blob);
        const format = mimeType.includes("webm") ? "webm" : "m4a";
        setAudio({ data, format });
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (err) {
      alert("Não foi possível acessar o microfone: " + (err as Error).message);
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  async function send() {
    const text = input.trim();
    if (!text && images.length === 0 && !audio) return;
    if (streaming) return;

    const userMsg: Msg = { role: "user", content: text || "(áudio/imagens)", images, audio };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setImages([]);
    setAudio(null);
    setStreaming(true);

    // Placeholder para streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
            images: m.images,
            audio: m.audio,
          })),
        }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text();
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: `❌ ${errText}` };
          return copy;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const l = line.trim();
          if (!l.startsWith("data:")) continue;
          const payload = l.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length) {
              acc += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: `❌ Erro: ${(err as Error).message}` };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  function downloadHtml() {
    if (!latestHtml) return;
    const blob = new Blob([latestHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(name ?? "site").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function sharePreview() {
    if (!historyId) return;
    const url = `${window.location.origin}/preview/${historyId}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      window.prompt("Copie o link da prévia:", url);
    }
  }

  async function publishSite() {
    if (!historyId || !latestHtml) return;
    updateHistory(historyId, { published: true });
    setPublished(true);
    const url = `${window.location.origin}/preview/${historyId}`;
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    setTimeout(() => setPublished(false), 2500);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Link to="/" className="glass-btn"><ArrowLeft className="h-3.5 w-3.5" /> Voltar</Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" /> Criador com IA {name ? `— ${name}` : ""}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setPreview("preview")} className={`glass-btn ${preview === "preview" ? "border-primary!" : ""}`}><Eye className="h-3.5 w-3.5" /> Preview</button>
            <button onClick={() => setPreview("code")} className={`glass-btn ${preview === "code" ? "border-primary!" : ""}`}><Code2 className="h-3.5 w-3.5" /> Código</button>
            <button onClick={sharePreview} disabled={!latestHtml} className="glass-btn disabled:opacity-40">
              {shareCopied ? <><Check className="h-3.5 w-3.5" /> Link copiado</> : <><Share2 className="h-3.5 w-3.5" /> Compartilhar prévia</>}
            </button>
            <button onClick={downloadHtml} disabled={!latestHtml} className="glass-btn disabled:opacity-40">
              <Download className="h-3.5 w-3.5" /> Baixar HTML
            </button>
            <button onClick={publishSite} disabled={!latestHtml} className="gradient-button rounded-full px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">
              <span className="inline-flex items-center gap-1.5">
                {published ? <><Check className="h-3.5 w-3.5" /> Publicado</> : <><Rocket className="h-3.5 w-3.5" /> Publicar site</>}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-4 p-4 lg:grid-cols-[420px_1fr]">
        {/* CHAT */}
        <div className="flex h-[calc(100vh-9rem)] flex-col rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl">
          <div ref={chatRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">👋 Olá! Sou o ProspectaAI.</p>
                <p className="mt-1">Descreva o site que você quer criar. Você pode enviar imagens de referência, gravar áudio ou digitar. Vou gerar um HTML completo para você baixar.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <div className={`inline-block max-w-[95%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-white" : "border border-border/60 bg-background/60"}`}>
                  {m.images && m.images.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {m.images.map((src, k) => (
                        <img key={k} src={src} alt="" className="h-16 w-16 rounded-lg object-cover" />
                      ))}
                    </div>
                  )}
                  {m.audio && <div className="mb-2 text-xs opacity-80">🎙️ Áudio enviado</div>}
                  <div className="whitespace-pre-wrap break-words">{m.content || (streaming && i === messages.length - 1 ? "…" : "")}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Composer */}
          <div className="border-t border-border/60 p-3">
            {(images.length > 0 || audio) && (
              <div className="mb-2 flex flex-wrap gap-2">
                {images.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="" className="h-14 w-14 rounded-lg object-cover" />
                    <button type="button" onClick={() => setImages((prev) => prev.filter((_, k) => k !== i))} className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {audio && (
                  <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs">
                    🎙️ Áudio pronto
                    <button onClick={() => setAudio(null)}><X className="h-3 w-3" /></button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Descreva o site que você quer..."
                rows={2}
                className="flex-1 resize-none rounded-xl border border-border/60 bg-background/60 p-3 text-sm outline-none focus:border-primary"
              />
              <div className="flex flex-col gap-1">
                <label className="cursor-pointer rounded-xl border border-border/60 bg-background/60 p-2 hover:border-primary" title="Anexar imagem">
                  <ImagePlus className="h-4 w-4" />
                  <input type="file" accept="image/*" multiple onChange={handleImageInput} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={recording ? stopRecording : startRecording}
                  className={`rounded-xl border p-2 ${recording ? "border-red-500 bg-red-500/20 text-red-300" : "border-border/60 bg-background/60 hover:border-primary"}`}
                  title={recording ? "Parar gravação" : "Gravar áudio"}
                >
                  {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>
              <button
                onClick={send}
                disabled={streaming}
                className="gradient-button rounded-xl p-3 text-white disabled:opacity-50"
                title="Enviar"
              >
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* PREVIEW / CODE */}
        <div className="flex h-[calc(100vh-9rem)] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl">
          {!latestHtml ? (
            <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
              <div>
                <Sparkles className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>O preview do site aparecerá aqui.</p>
                <p className="mt-1 text-xs">Peça para a IA criar um site no chat ao lado.</p>
              </div>
            </div>
          ) : preview === "preview" ? (
            <iframe title="preview" srcDoc={latestHtml} className="h-full w-full bg-white" sandbox="allow-scripts allow-same-origin" />
          ) : (
            <pre className="h-full overflow-auto p-4 font-mono text-xs leading-relaxed">
              <code>{latestHtml}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
