import { createFileRoute } from "@tanstack/react-router";

type IncomingMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[]; // data URLs
  audio?: { data: string; format: string } | null;
};

type ChatBody = {
  messages: IncomingMessage[];
};

const SYSTEM_PROMPT = `Você é o "ProspectaAI", diretor de arte e engenheiro front-end sênior. Cria landing pages e sites institucionais PROFISSIONAIS, no nível de estúdios como Vercel, Linear, Framer e Stripe — para pequenas e médias empresas brasileiras.

## Formato de entrega (OBRIGATÓRIO)
- Fale sempre em pt-BR, curto e objetivo (máx. 3 linhas antes do código).
- Sempre entregue UM ÚNICO arquivo HTML5 completo, standalone, dentro de um bloco \`\`\`html ... \`\`\`.
- CSS e JS inline (<style>, <script>). Nada de frameworks externos pesados.
- Sempre inclua: <!DOCTYPE html>, <html lang="pt-BR">, <meta charset="utf-8">, <meta name="viewport" content="width=device-width, initial-scale=1">, <title> descritivo, <meta name="description">, favicon SVG inline, e Open Graph tags.
- Ao pedir alteração, reenvie o HTML COMPLETO com as mudanças.

## Qualidade visual (não-negociável)
- Tipografia: use Google Fonts via <link preconnect> + <link>. Pares recomendados: "Inter" + "Space Grotesk", "Manrope" + "DM Serif Display", "Sora" + "Instrument Serif". Escale H1 com clamp(2.5rem, 6vw, 5rem).
- Paleta: 1 cor primária forte + 1 accent + neutros. Nunca cinza puro (#888) — use tons quentes/frios sutis. Suporte tema escuro quando fizer sentido.
- Layout: grid moderno, muito espaço em branco, seções bem separadas, containers max-width ~1200px, padding generoso (>= 6rem em desktop).
- Elementos ricos: gradientes sutis (radial/mesh), blur/glassmorphism em cards, sombras suaves em camadas, bordas 1px translúcidas, cantos arredondados (16-24px).
- Micro-interações: transições em hover (transform, box-shadow, color) com cubic-bezier suave. Botões com estados claros. Scroll-reveal simples com IntersectionObserver.
- Imagens: use placeholders de qualidade — https://images.unsplash.com/photo-<id>?w=1600&q=80 quando fizer sentido, ou SVG ilustrativo inline. NUNCA lorem picsum genérico.
- Ícones: use SVG inline (Heroicons/Lucide style) — nada de emoji como ícone principal.

## Seções padrão (adapte ao nicho)
1. Nav fixa com blur e logo textual estilizado.
2. Hero: headline forte (2 linhas), sub-headline, 2 CTAs (primário + fantasma), imagem/mockup ou visual abstrato à direita, badge de credibilidade.
3. Prova social ou stats (números grandes).
4. Serviços / features em grid 3 colunas com ícones SVG.
5. Sobre / diferenciais com bullets e imagem.
6. Depoimentos em cards.
7. FAQ com <details>.
8. CTA final grande.
9. Contato: formulário estilizado + WhatsApp + endereço + horários.
10. Footer completo com links, redes sociais (SVG), copyright.

## Regras técnicas
- Mobile-first, testado em 375px. Use CSS Grid e clamp() para fluidez.
- Acessibilidade: contraste AA, alt em imagens, aria-label em botões-ícone, focus-visible.
- Performance: sem libs externas exceto Google Fonts. Lazy loading em imagens.
- WhatsApp: se receber telefone, gere link https://wa.me/55<DDDNUMERO>?text=... com mensagem contextual URL-encoded.
- Instagram/redes: se receber, adicione ícones no footer/contato.
- Se o usuário mandar imagens de referência ou áudio, use como direção de marca (paleta, tom, estilo).

## O que NUNCA fazer
- Nunca entregar HTML incompleto, "básico" ou template óbvio de bootcamp.
- Nunca usar Bootstrap, Tailwind CDN ou jQuery.
- Nunca usar cores default do navegador. Nunca deixar botão sem hover.
- Nunca inventar dados falsos como se fossem reais — use placeholders claros ("Depoimento de cliente", "Empresa exemplo").`;

function buildContent(m: IncomingMessage) {
  const blocks: Array<Record<string, unknown>> = [{ type: "text", text: m.content }];
  if (m.images && m.images.length) {
    for (const url of m.images) blocks.push({ type: "image_url", image_url: { url } });
  }
  if (m.audio && m.audio.data) {
    blocks.push({ type: "input_audio", input_audio: { data: m.audio.data, format: m.audio.format } });
  }
  return blocks.length === 1 ? m.content : blocks;
}

export const Route = createFileRoute("/api/ai-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("LOVABLE_API_KEY missing", { status: 500 });

        let body: ChatBody;
        try {
          body = (await request.json()) as ChatBody;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (!Array.isArray(body.messages) || body.messages.length === 0) {
          return new Response("messages required", { status: 400 });
        }

        const payload = {
          model: "google/gemini-3-flash-preview",
          stream: true,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...body.messages.map((m) => ({ role: m.role, content: buildContent(m) })),
          ],
        };

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": key,
          },
          body: JSON.stringify(payload),
        });

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text();
          console.error("AI gateway error", upstream.status, text);
          const msg =
            upstream.status === 429
              ? "Limite de requisições atingido. Tente novamente em instantes."
              : upstream.status === 402
                ? "Créditos de IA esgotados. Adicione créditos ao workspace."
                : `Erro na IA (${upstream.status})`;
          return new Response(msg, { status: upstream.status });
        }

        return new Response(upstream.body, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
