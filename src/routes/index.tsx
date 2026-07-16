import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, lazy, Suspense } from "react";
import { Search, MapPin, Building2, Star, Phone, Globe, MessageCircle, Sparkles, Loader2 } from "lucide-react";
import { searchPlaces, type PlaceResult } from "@/lib/places.functions";

const DotGlobe = lazy(() => import("@/components/DotGlobe").then(m => ({ default: m.DotGlobe })));

export const Route = createFileRoute("/")({
  component: Home,
});

const SUGGESTIONS = [
  "Clínica de estética", "Barbearia", "Salão de beleza", "Dentista", "Psicólogo",
  "Nutricionista", "Personal trainer", "Academia", "Fisioterapeuta", "Quiropraxista",
  "Lava rápido", "Oficina mecânica", "Energia solar", "Empresa de limpeza", "Dedetizadora",
  "Vidraçaria", "Marcenaria", "Marmoraria", "Serralheria", "Ar-condicionado",
  "Eletricista", "Encanador", "Pintor", "Pedreiro", "Empresa de reforma",
  "Loja de piscina", "Manicure",
];

const WHATSAPP_MSG = `Olá! Tudo bem?

Meu nome é Dev e trabalho com desenvolvimento de sites profissionais. Gostaria de apresentar uma solução que pode ajudar a sua loja a ter uma presença online mais forte.

Desenvolvo sites modernos, personalizados e responsivos, que passam mais credibilidade, organizam melhor as informações da empresa, facilitam o contato e os agendamentos, além de oferecerem mais praticidade para os seus clientes.

Se tiver interesse, será um prazer mostrar alguns projetos que já desenvolvi e conversar sobre como posso criar um site ideal para o seu negócio. Fico à disposição!`;

function whatsappLink(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(WHATSAPP_MSG)}`;
}

function Home() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [lastSearch, setLastSearch] = useState<{ q: string; l: string } | null>(null);
  const search = useServerFn(searchPlaces);
  const mutation = useMutation({
    mutationFn: (vars: { query: string; location: string }) => search({ data: vars }),
    onSuccess: (_, vars) => setLastSearch({ q: vars.query, l: vars.location }),
  });

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || !location.trim()) return;
    mutation.mutate({ query: query.trim(), location: location.trim() });
  };

  const results = mutation.data ?? [];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <section className="relative">
        <Suspense fallback={null}>
          <DotGlobe />
        </Suspense>
        <div className="relative z-10 mx-auto max-w-5xl px-4 pt-16 pb-10 sm:pt-24">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-royal/40 bg-royal/10 px-3 py-1 text-xs font-medium text-royal-bright backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Prospectador
          </div>
          <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
            {"\n"}
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Encontre empresas qualificadas de qualquer segmento e cidade do Brasil. Dados direto do Google Places para acelerar sua equipe de vendas.
          </p>

          <form onSubmit={handleSearch} className="mt-10">
            <div className="relative rounded-2xl border border-royal/30 bg-card/60 p-3 backdrop-blur-xl shadow-[0_0_60px_-15px_rgba(59,130,246,0.5)]">
              <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-royal-bright/30 via-primary/20 to-royal-bright/30 opacity-70 blur-xl" />
              <div className="relative grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <label className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-4 py-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Segmento (ex: Barbearia)"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                  />
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-4 py-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Cidade / região"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                  />
                </label>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="gradient-button rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {mutation.isPending ? (
                    <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Buscando…</span>
                  ) : (
                    <span className="inline-flex items-center gap-2"><Search className="h-4 w-4" /> Buscar empresas</span>
                  )}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQuery(s)}
                    className="rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs text-muted-foreground transition hover:border-royal/60 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {mutation.isError && (
            <p className="mt-4 text-sm text-destructive">
              {(mutation.error as Error).message}
            </p>
          )}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-24">
        {lastSearch && (
          <div className="mb-6 flex items-center justify-between">
            <p className="font-mono text-sm text-muted-foreground">
              Resultados para <span className="text-foreground">{lastSearch.q}</span> em{" "}
              <span className="text-foreground">{lastSearch.l}</span>
            </p>
            <span className="rounded-full border border-border/60 bg-card/60 px-3 py-1 font-mono text-xs text-muted-foreground">
              {results.length} empresas
            </span>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {results.map((p) => (
            <BusinessCard key={p.id} place={p} />
          ))}
        </div>
      </section>
    </div>
  );
}

function BusinessCard({ place }: { place: PlaceResult }) {
  const wa = whatsappLink(place.phone);
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-xl transition hover:border-royal/60">
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-royal-bright/20 via-transparent to-primary/20 opacity-0 blur-lg transition group-hover:opacity-100" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-proggy text-lg font-semibold text-foreground">{place.name}</h3>
          {place.rating != null && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-xs text-amber-300">
              <Star className="h-3 w-3 fill-current" /> {place.rating.toFixed(1)}
              {place.userRatingCount != null && <span className="opacity-70">({place.userRatingCount})</span>}
            </span>
          )}
        </div>

        <div className="mt-3 space-y-1.5 font-proggy text-sm text-muted-foreground">
          {place.address && (
            <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {place.address}</p>
          )}
          {place.phone && (
            <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" /> {place.phone}</p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          )}
          {place.googleMapsUri && (
            <a href={place.googleMapsUri} target="_blank" rel="noopener noreferrer" className="glass-btn">
              <MapPin className="h-3.5 w-3.5" /> Ver no Maps
            </a>
          )}
          {place.websiteUri ? (
            <a href={place.websiteUri} target="_blank" rel="noopener noreferrer" className="glass-btn">
              <Globe className="h-3.5 w-3.5" /> Site
            </a>
          ) : (
            <span className="glass-btn opacity-60">
              <Globe className="h-3.5 w-3.5" /> Sem site
            </span>
          )}
          <button
            type="button"
            className="shiny-cta"
            onClick={() => alert("Criar Site com IA — em breve! Este recurso será adicionado na próxima fase.")}
          >
            <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Criar Site com IA</span>
          </button>
        </div>
      </div>
    </div>
  );
}
