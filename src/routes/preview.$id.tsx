import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/preview/$id")({
  component: PreviewPage,
});

function decodeHash(hash: string): string | null {
  try {
    const h = hash.startsWith("#") ? hash.slice(1) : hash;
    if (!h) return null;
    const bin = atob(h.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function PreviewPage() {
  const { id } = Route.useParams();
  const [html, setHtml] = useState<string | null>(null);
  const [name, setName] = useState<string>("Site");

  useEffect(() => {
    // 1. Try hash-encoded HTML (works cross-device / shared links)
    if (typeof window !== "undefined" && window.location.hash) {
      const decoded = decodeHash(window.location.hash);
      if (decoded) {
        setHtml(decoded);
        setName("Site compartilhado");
        return;
      }
    }
    // 2. Fallback: localStorage history (same-browser)
    try {
      const raw = localStorage.getItem("prospectalocal.settings.v1");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const item = (parsed.history ?? []).find((h: { id: string }) => h.id === id);
      if (item) {
        setHtml(item.html);
        setName(item.name);
      }
    } catch { /* ignore */ }
  }, [id]);

  if (!html) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Prévia não encontrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta prévia local não existe neste navegador. Use o botão "Compartilhar prévia" no criador de sites — ele gera um link que funciona em qualquer dispositivo.
          </p>
          <Link to="/" className="glass-btn mt-4 inline-flex"><ArrowLeft className="h-3.5 w-3.5" /> Voltar</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border/60 bg-background/70 px-4 py-2 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Link to="/" className="glass-btn"><ArrowLeft className="h-3.5 w-3.5" /> Voltar</Link>
          <span className="text-sm text-muted-foreground">Prévia: <span className="text-foreground">{name}</span></span>
        </div>
        <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="glass-btn">
          <ExternalLink className="h-3.5 w-3.5" /> Abrir em nova aba
        </a>
      </header>
      <iframe title={name} srcDoc={html} className="flex-1 w-full bg-white" sandbox="allow-scripts allow-forms allow-popups allow-modals" />
    </div>
  );
}
