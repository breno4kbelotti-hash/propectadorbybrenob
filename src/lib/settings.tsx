import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeSettings = {
  background: string;
  card: string;
  primary: string;
  foreground: string;
  border: string;
  accent: string;
};

export type AppSettings = {
  theme: ThemeSettings;
  whatsappMessage: string;
};

const DEFAULT_WA = `Olá! Tudo bem?

Meu nome é Dev e trabalho com desenvolvimento de sites profissionais. Gostaria de apresentar uma solução que pode ajudar a sua loja a ter uma presença online mais forte.

Desenvolvo sites modernos, personalizados e responsivos, que passam mais credibilidade, organizam melhor as informações da empresa, facilitam o contato e os agendamentos, além de oferecerem mais praticidade para os seus clientes.

Se tiver interesse, será um prazer mostrar alguns projetos que já desenvolvi e conversar sobre como posso criar um site ideal para o seu negócio. Fico à disposição!`;

export const DEFAULT_SETTINGS: AppSettings = {
  theme: {
    background: "#0a1128",
    card: "#111a3a",
    primary: "#3b82f6",
    foreground: "#f5f7ff",
    border: "#1e2a5a",
    accent: "#60a5fa",
  },
  whatsappMessage: DEFAULT_WA,
};

const KEY = "prospectalocal.settings.v1";

type Ctx = {
  settings: AppSettings;
  setTheme: (patch: Partial<ThemeSettings>) => void;
  setWhatsappMessage: (msg: string) => void;
  reset: () => void;
};

const SettingsContext = createContext<Ctx | null>(null);

function applyTheme(t: ThemeSettings) {
  if (typeof document === "undefined") return;
  const r = document.documentElement.style;
  r.setProperty("--background", t.background);
  r.setProperty("--card", t.card);
  r.setProperty("--popover", t.card);
  r.setProperty("--primary", t.primary);
  r.setProperty("--ring", t.primary);
  r.setProperty("--royal", t.primary);
  r.setProperty("--royal-bright", t.accent);
  r.setProperty("--foreground", t.foreground);
  r.setProperty("--card-foreground", t.foreground);
  r.setProperty("--popover-foreground", t.foreground);
  r.setProperty("--primary-foreground", "#ffffff");
  r.setProperty("--border", t.border);
  r.setProperty("--input", t.border);
  r.setProperty("--accent", t.accent);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        const merged: AppSettings = {
          theme: { ...DEFAULT_SETTINGS.theme, ...(parsed.theme ?? {}) },
          whatsappMessage: parsed.whatsappMessage ?? DEFAULT_SETTINGS.whatsappMessage,
        };
        setSettings(merged);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applyTheme(settings.theme);
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings, hydrated]);

  const value: Ctx = {
    settings,
    setTheme: (patch) => setSettings((s) => ({ ...s, theme: { ...s.theme, ...patch } })),
    setWhatsappMessage: (msg) => setSettings((s) => ({ ...s, whatsappMessage: msg })),
    reset: () => setSettings(DEFAULT_SETTINGS),
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
