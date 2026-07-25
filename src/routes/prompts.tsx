import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Copy, Check, Trash2, Plus, Film, ImagePlus, Library, X } from "lucide-react";
import {
  listPrompts,
  savePrompt,
  deletePrompt,
  getPromptMediaUrl,
  MAX_MEDIA_BYTES,
  type PromptItem,
} from "@/lib/prompt-library";

export const Route = createFileRoute("/prompts")({
  component: Prompts,
  head: () => ({
    meta: [
      { title: "Biblioteca de Prompts | Prospectador" },
      { name: "description", content: "Salve, organize e copie prompts de criação de sites com prévia em foto ou vídeo." },
      { property: "og:title", content: "Biblioteca de Prompts | Prospectador" },
      { property: "og:description", content: "Salve, organize e copie prompts de criação de sites com prévia em foto ou vídeo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function PromptCard({ item, onDelete }: { item: PromptItem; onDelete: (id: string) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    let created: string | null = null;
    if (item.media) {
      getPromptMediaUrl(item.id).then((u) => {
        if (!active) { if (u) URL.revokeObjectURL(u); return; }
        created = u;
        setUrl(u);
      });
    }
    return () => {
      active = false;
      if (created) URL.revokeObjectURL(created);
    };
  }, [item.id, item.media]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(item.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  }

  return (
    <li className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl transition hover:border-primary/60">
      {item.media && (
        <div className="aspect-video w-full bg-black/40">
          {url ? (
            item.media.kind === "video" ? (
              <video src={url} controls className="h-full w-full object-cover" />
            ) : (
              <img src={url} alt={item.title} className="h-full w-full object-cover" />
            )
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">carregando mídia…</div>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{item.title}</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {new Date(item.createdAt).toLocaleString("pt-BR")}
              {item.media && ` • ${(item.media.size / 1024 / 1024).toFixed(1)} MB`}
            </p>
          </div>
          <button onClick={() => onDelete(item.id)} className="glass-btn hover:!border-destructive" title="Excluir">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-3 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border/50 bg-background/50 p-3 text-xs leading-relaxed">
          {item.content}
        </p>
        <div className="mt-3 flex gap-2">
          <button onClick={copy} className="gradient-button flex-1 rounded-xl py-2 text-xs font-semibold text-white">
            <span className="inline-flex items-center gap-1.5">
              {copied ? <><Check className="h-3.5 w-3.5" /> Copiado</> : <><Copy className="h-3.5 w-3.5" /> Copiar prompt</>}
            </span>
          </button>
          <Link to="/builder" className="glass-btn">Usar na IA</Link>
        </div>
      </div>
    </li>
  );
}

function Prompts() {
  const [items, setItems] = useState<PromptItem[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => { listPrompts().then(setItems).catch(() => setItems([])); }, []);
  useEffect(() => { refresh(); }, [refresh]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!f) return;
    if (f.size > MAX_MEDIA_BYTES) {
      setError("Arquivo maior que 500 MB.");
      return;
    }
    setError("");
    setFile(f);
  }

  async function save() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await savePrompt(
        {
          id,
          title: title.trim(),
          content: content.trim(),
          createdAt: Date.now(),
          media: file
            ? {
                kind: file.type.startsWith("video") ? "video" : "image",
                mime: file.type,
                name: file.name,
                size: file.size,
              }
            : undefined,
        },
        file,
      );
      setTitle(""); setContent(""); setFile(null); setOpen(false);
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await deletePrompt(id);
    refresh();
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-2">
          <Link to="/" className="glass-btn"><ArrowLeft className="h-3.5 w-3.5" /> Voltar</Link>
          <button onClick={() => setOpen(true)} className="gradient-button rounded-full px-4 py-2 text-xs font-semibold text-white">
            <span className="inline-flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Novo prompt</span>
          </button>
        </div>

        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 via-card/60 to-background/40 p-8 backdrop-blur-xl shadow-[0_0_80px_-20px_rgba(var(--shadow-rgb,59_130_246),0.5)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-royal-bright">
            <Library className="h-3.5 w-3.5" /> Biblioteca
          </div>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Prompts salvos</h1>
          <p className="mt-2 text-muted-foreground">
            Guarde seus melhores prompts de criação de sites, anexe uma foto ou vídeo (até 500 MB) mostrando o resultado e copie com um clique.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
            Nenhum prompt salvo ainda. Clique em <span className="text-foreground">Novo prompt</span>.
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => <PromptCard key={it.id} item={it} onDelete={remove} />)}
          </ul>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Novo prompt</h2>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-white/10"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Título</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Landing page de barbearia" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Prompt</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={7} className="w-full rounded-xl border border-border/60 bg-background/60 p-3 text-sm outline-none focus:border-primary" placeholder="Crie um site moderno para..." />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Foto ou vídeo do resultado (máx. 500 MB)</label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="glass-btn cursor-pointer">
                    <ImagePlus className="h-3.5 w-3.5" /> Escolher arquivo
                    <input type="file" accept="image/*,video/*" onChange={onFile} className="hidden" />
                  </label>
                  {file && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Film className="h-3.5 w-3.5" /> {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      <button onClick={() => setFile(null)}><X className="h-3 w-3" /></button>
                    </span>
                  )}
                </div>
              </div>
              {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}
              <button onClick={save} disabled={saving || !title.trim() || !content.trim()} className="gradient-button w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40">
                {saving ? "Salvando…" : "Salvar prompt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
