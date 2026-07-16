import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/preview/$id")({
  component: PreviewPage,
});

function PreviewPage() {
  const { id } = Route.useParams();
  const [html, setHtml] = useState<string | null>(null);
  const [name, setName] = useState<string>("Site");

  useEffect(() => {
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
            Esta prévia é armazenada localmente neste navegador. Se você abriu o link em outro dispositivo, peça para baixar o HTML.
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
      <iframe title={name} srcDoc={html} className="flex-1 w-full bg-white" sandbox="allow-scripts allow-same-origin" />
    </div>
  );
}
