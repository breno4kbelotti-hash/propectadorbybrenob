import { createFileRoute } from "@tanstack/react-router";

type Body = {
  repoName: string;
  html: string;
  description?: string;
  private?: boolean;
};

const GATEWAY = "https://connector-gateway.lovable.dev/github";

async function gh(path: string, init: RequestInit = {}) {
  const lovable = process.env.LOVABLE_API_KEY;
  const gh = process.env.GITHUB_API_KEY;
  if (!lovable || !gh) throw new Error("GitHub connector não configurado");
  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${lovable}`,
      "X-Connection-Api-Key": gh,
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${json.message || text}`);
  return json;
}

function toB64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  // eslint-disable-next-line no-restricted-globals
  return btoa(bin);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `site-${Date.now()}`;
}

export const Route = createFileRoute("/api/github-publish")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (!body.html || !body.repoName) {
          return new Response("repoName e html são obrigatórios", { status: 400 });
        }

        try {
          const me = await gh("/user");
          const owner: string = me.login;
          const name = slugify(body.repoName);

          // Create repo (auto-init so we have a default branch)
          const repo = await gh("/user/repos", {
            method: "POST",
            body: JSON.stringify({
              name,
              description: body.description ?? "Site gerado pelo Prospectador",
              private: !!body.private,
              auto_init: true,
              homepage: `https://${owner}.github.io/${name}/`,
            }),
          });

          // Push index.html
          await gh(`/repos/${owner}/${repo.name}/contents/index.html`, {
            method: "PUT",
            body: JSON.stringify({
              message: "Publicando site via Prospectador",
              content: toB64(body.html),
            }),
          });

          // Enable GitHub Pages from main branch (best-effort)
          let pagesUrl: string | null = null;
          try {
            const pages = await gh(`/repos/${owner}/${repo.name}/pages`, {
              method: "POST",
              body: JSON.stringify({ source: { branch: "main", path: "/" } }),
            });
            pagesUrl = pages.html_url ?? `https://${owner}.github.io/${repo.name}/`;
          } catch {
            pagesUrl = `https://${owner}.github.io/${repo.name}/`;
          }

          return Response.json({
            ok: true,
            repoUrl: repo.html_url,
            owner,
            repoName: repo.name,
            pagesUrl,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("github-publish error", msg);
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});
