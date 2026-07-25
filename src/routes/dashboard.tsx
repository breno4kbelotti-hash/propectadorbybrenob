import { createFileRoute, Link } from "@tanstack/react-router";
import { useSettings, DEFAULT_SETTINGS, type ThemeSettings } from "@/lib/settings";
import { ArrowLeft, RotateCcw, Palette, MessageCircle, History, Trash2, Eye, Download, Globe2, Sparkles, Library } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

const LABELS: Record<keyof ThemeSettings, string> = {
  background: "Fundo do site",
  card: "Fundo dos cards",
  primary: "Cor principal (botões)",
  foreground: "Cor do texto",
  border: "Cor das bordas",
  accent: "Cor de destaque",
  globe: "Cor do globo 3D",
  shadow: "Cor das sombras / brilho",
};

function Dashboard() {
  const { settings, setTheme, setWhatsappMessage, reset, removeHistory } = useSettings();

  function downloadHistory(id: string) {
    const item = settings.history.find((h) => h.id === id);
    if (!item) return;
    const blob = new Blob([item.html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="glass-btn"><ArrowLeft className="h-3.5 w-3.5" /> Voltar</Link>
          <div className="flex gap-2">
            <Link to="/prompts" className="glass-btn"><Library className="h-3.5 w-3.5" /> Biblioteca de prompts</Link>
            <button onClick={reset} className="glass-btn"><RotateCcw className="h-3.5 w-3.5" /> Restaurar padrão</button>
          </div>

        </div>

        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 via-card/60 to-background/40 p-8 backdrop-blur-xl shadow-[0_0_80px_-20px_rgba(var(--shadow-rgb,59_130_246),0.5)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-royal-bright">
            <Sparkles className="h-3.5 w-3.5" /> Painel
          </div>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Personalize o visual, gerencie a mensagem do WhatsApp e veja o histórico de sites criados.</p>
        </div>

        <section className="mt-8 rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-xl">
          <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold"><Palette className="h-5 w-5" /> Cores do site</h2>
          <p className="mb-5 text-sm text-muted-foreground">Ajuste toda a paleta, incluindo o globo 3D e as sombras.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(LABELS) as Array<keyof ThemeSettings>).map((k) => (
              <label key={k} className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 p-3 transition hover:border-primary/60">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    {k === "globe" && <Globe2 className="h-3.5 w-3.5 text-royal-bright" />}
                    {LABELS[k]}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">{settings.theme[k]}</p>
                </div>
                <input
                  type="color"
                  value={settings.theme[k]}
                  onChange={(e) => setTheme({ [k]: e.target.value } as Partial<ThemeSettings>)}
                  className="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-border/60 bg-transparent"
                />
              </label>
            ))}
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-4">
            {[
              { label: "Azul Royal", theme: DEFAULT_SETTINGS.theme },
              { label: "Verde Neon", theme: { background: "#08130f", card: "#0f2419", primary: "#10b981", foreground: "#e6fff5", border: "#134e39", accent: "#34d399", globe: "#34d399", shadow: "#10b981" } },
              { label: "Roxo Cyber", theme: { background: "#120823", card: "#1c0f38", primary: "#a855f7", foreground: "#f5edff", border: "#3b2168", accent: "#c084fc", globe: "#c084fc", shadow: "#a855f7" } },
              { label: "Laranja Solar", theme: { background: "#1a0f05", card: "#2b1a09", primary: "#f97316", foreground: "#fff5eb", border: "#5c2f0d", accent: "#fb923c", globe: "#fb923c", shadow: "#f97316" } },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setTheme(preset.theme)}
                className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm transition hover:border-primary"
              >
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full" style={{ background: preset.theme.primary }} />
                  {preset.label}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-xl">
          <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold"><MessageCircle className="h-5 w-5" /> Mensagem automática do WhatsApp</h2>
          <p className="mb-4 text-sm text-muted-foreground">Enviada quando você clica no botão WhatsApp de qualquer empresa.</p>
          <textarea
            value={settings.whatsappMessage}
            onChange={(e) => setWhatsappMessage(e.target.value)}
            rows={10}
            className="w-full rounded-xl border border-border/60 bg-background/60 p-4 font-sans text-sm outline-none focus:border-primary"
          />
          <p className="mt-2 text-xs text-muted-foreground">{settings.whatsappMessage.length} caracteres</p>
        </section>

        <section className="mt-8 rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-xl">
          <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold"><History className="h-5 w-5" /> Histórico de sites criados</h2>
          <p className="mb-4 text-sm text-muted-foreground">Sites gerados pela IA ficam salvos neste navegador.</p>

          {settings.history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
              Você ainda não criou nenhum site. Vá até um card de empresa e clique em <span className="text-foreground">Criar Site com IA</span>.
            </div>
          ) : (
            <ul className="space-y-3">
              {settings.history.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{h.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {new Date(h.createdAt).toLocaleString("pt-BR")}
                      {h.published && <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300">publicado</span>}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to="/preview/$id" params={{ id: h.id }} className="glass-btn"><Eye className="h-3.5 w-3.5" /> Ver</Link>
                    <button onClick={() => downloadHistory(h.id)} className="glass-btn"><Download className="h-3.5 w-3.5" /> HTML</button>
                    <button onClick={() => removeHistory(h.id)} className="glass-btn hover:!border-destructive"><Trash2 className="h-3.5 w-3.5" /> Excluir</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
