import { createFileRoute, Link } from "@tanstack/react-router";
import { useSettings, DEFAULT_SETTINGS, type ThemeSettings } from "@/lib/settings";
import { ArrowLeft, RotateCcw, Palette, MessageCircle } from "lucide-react";

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
};

function Dashboard() {
  const { settings, setTheme, setWhatsappMessage, reset } = useSettings();

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="glass-btn"><ArrowLeft className="h-3.5 w-3.5" /> Voltar</Link>
          <button onClick={reset} className="glass-btn"><RotateCcw className="h-3.5 w-3.5" /> Restaurar padrão</button>
        </div>

        <h1 className="text-3xl font-bold sm:text-4xl">Dashboard de configurações</h1>
        <p className="mt-2 text-muted-foreground">Personalize o visual do site e a mensagem automática do WhatsApp.</p>

        <section className="mt-10 rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-xl">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><Palette className="h-5 w-5" /> Cores do site</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(Object.keys(LABELS) as Array<keyof ThemeSettings>).map((k) => (
              <label key={k} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 p-3">
                <div>
                  <p className="text-sm font-medium">{LABELS[k]}</p>
                  <p className="font-mono text-xs text-muted-foreground">{settings.theme[k]}</p>
                </div>
                <input
                  type="color"
                  value={settings.theme[k]}
                  onChange={(e) => setTheme({ [k]: e.target.value } as Partial<ThemeSettings>)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-border/60 bg-transparent"
                />
              </label>
            ))}
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-4">
            {[
              { label: "Azul Royal", theme: DEFAULT_SETTINGS.theme },
              { label: "Verde Neon", theme: { background: "#08130f", card: "#0f2419", primary: "#10b981", foreground: "#e6fff5", border: "#134e39", accent: "#34d399" } },
              { label: "Roxo Cyber", theme: { background: "#120823", card: "#1c0f38", primary: "#a855f7", foreground: "#f5edff", border: "#3b2168", accent: "#c084fc" } },
              { label: "Laranja Solar", theme: { background: "#1a0f05", card: "#2b1a09", primary: "#f97316", foreground: "#fff5eb", border: "#5c2f0d", accent: "#fb923c" } },
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
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><MessageCircle className="h-5 w-5" /> Mensagem automática do WhatsApp</h2>
          <p className="mb-3 text-sm text-muted-foreground">Esta mensagem será enviada quando você clicar no botão WhatsApp de qualquer empresa.</p>
          <textarea
            value={settings.whatsappMessage}
            onChange={(e) => setWhatsappMessage(e.target.value)}
            rows={12}
            className="w-full rounded-xl border border-border/60 bg-background/60 p-4 font-sans text-sm outline-none focus:border-primary"
          />
          <p className="mt-2 text-xs text-muted-foreground">{settings.whatsappMessage.length} caracteres</p>
        </section>
      </div>
    </div>
  );
}
