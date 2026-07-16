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

const SYSTEM_PROMPT = `Você é o "ProspectaAI", uma IA de desenvolvimento de sites igual à IA da Lovable, mas focada em criar landing pages e sites institucionais para pequenas empresas brasileiras (barbearias, clínicas, oficinas, etc).

Regras:
- Fale sempre em português do Brasil, de forma amigável e objetiva.
- Quando o usuário pedir um site, ENTREGUE sempre um único arquivo HTML completo, standalone, com CSS e JS inline em <style> e <script>, envolvido em um único bloco de código markdown \`\`\`html ... \`\`\`.
- O HTML deve ser moderno, responsivo, com boa tipografia (use Google Fonts via <link>), gradientes sutis, botões com bom contraste, seções claras (hero, serviços, sobre, contato), e um botão de WhatsApp funcional se um número for fornecido.
- Sempre inclua meta viewport e um <title> descritivo.
- Antes do bloco de código, escreva 2-3 linhas explicando o que você fez.
- Se o usuário enviar imagens ou áudio, use como referência de estilo, marca ou requisitos.
- Se o usuário pedir alterações, entregue o HTML COMPLETO novamente com as mudanças, não apenas o trecho.`;

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
