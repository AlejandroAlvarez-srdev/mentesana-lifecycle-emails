// Cron cada 5 min: para posts en status='published' con seo_status='pending',
// Claude genera meta_description, og_title, schema Article JSON-LD,
// keywords y 3 internal_links sugeridos. El cuerpo del post NUNCA se toca.
import { NextRequest, NextResponse } from "next/server";
import { psyBlogSb } from "@/lib/psy-blog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ANTHROPIC_KEY = (process.env.ANTHROPIC_API_KEY ?? "").replace(/[^\x20-\x7E]/g, "").trim();
const MODEL = "claude-haiku-4-5-20251001";
const CRON_SECRET = process.env.CRON_SECRET;
const SITE = "https://mentesanapsicologia.com";

interface SeoOut {
  meta_description: string;
  og_title: string;
  meta_keywords: string[];
  internal_links: { slug: string; title: string }[];
}

async function generateSeo(post: { title: string; keyword: string; body_md: string }): Promise<SeoOut> {
  const excerpt = post.body_md.slice(0, 2000);
  const prompt = `Eres SEO senior para Mente Sana Psicología (mentesanapsicologia.com), psicología online en España.

Te paso un artículo recién publicado. Genera SEO post-publicación.

Título: ${post.title}
Keyword principal: ${post.keyword}
Contenido (extracto, no lo modifiques):
"""${excerpt}"""

Devuelve SOLO JSON válido:
{
  "meta_description": "max 155 caracteres, contiene la keyword, promete valor concreto, sin clickbait",
  "og_title": "max 60 caracteres, gancho para Twitter/Facebook",
  "meta_keywords": ["máximo 6 términos relacionados con la keyword principal"],
  "internal_links": [
    {"slug": "ansiedad-tratamiento", "title": "Tratamiento de la ansiedad"},
    {"slug": "...", "title": "..."},
    {"slug": "...", "title": "..."}
  ]
}

Los internal_links deben ser sugerencias de slugs a otros artículos de psicología que tengan sentido enlazar desde este post. Inventa slugs plausibles si no estás seguro — los validamos después.`;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 800, temperature: 0.4, messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) throw new Error(`claude_${r.status}`);
  const j = await r.json();
  const text: string = j.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match?.[0] ?? text);
  return {
    meta_description: String(parsed.meta_description ?? "").slice(0, 160),
    og_title: String(parsed.og_title ?? "").slice(0, 70),
    meta_keywords: Array.isArray(parsed.meta_keywords) ? parsed.meta_keywords.slice(0, 6).map(String) : [],
    internal_links: Array.isArray(parsed.internal_links)
      ? parsed.internal_links.slice(0, 3).map((l: { slug?: string; title?: string }) => ({
          slug: String(l.slug ?? ""), title: String(l.title ?? ""),
        })).filter((l: { slug: string }) => l.slug)
      : [],
  };
}

function buildSchema(post: { title: string; slug: string; author_name: string; published_at: string | null; hero_url: string | null; meta_description: string | null }): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "image": post.hero_url ? [post.hero_url] : [],
    "datePublished": post.published_at,
    "dateModified": post.published_at,
    "author": { "@type": "Person", "name": post.author_name },
    "publisher": {
      "@type": "Organization",
      "name": "Mente Sana Psicología",
      "logo": { "@type": "ImageObject", "url": `${SITE}/images/logo.webp` },
    },
    "description": post.meta_description ?? "",
    "mainEntityOfPage": { "@type": "WebPage", "@id": `${SITE}/blog/${post.slug}` },
  };
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!ANTHROPIC_KEY) return NextResponse.json({ error: "ai_not_configured" }, { status: 500 });

  const sb = psyBlogSb();
  const pending = await sb
    .from("psy_blog_posts")
    .select("id, title, slug, keyword, body_md, author_name, published_at, hero_url")
    .eq("status", "published")
    .eq("seo_status", "pending")
    .order("published_at", { ascending: true })
    .limit(8);
  if (pending.error) return NextResponse.json({ error: pending.error.message }, { status: 500 });
  if (!pending.data || pending.data.length === 0) return NextResponse.json({ ok: true, processed: 0 });

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const post of pending.data) {
    try {
      // Lock CAS
      const lock = await sb.from("psy_blog_posts").update({ seo_status: "generating" }).eq("id", post.id).eq("seo_status", "pending").select().maybeSingle();
      if (!lock.data) { results.push({ id: post.id, ok: false, error: "lock_skipped" }); continue; }

      const seo = await generateSeo({ title: post.title, keyword: post.keyword, body_md: post.body_md });
      const schema = buildSchema({
        title: post.title, slug: post.slug, author_name: post.author_name,
        published_at: post.published_at, hero_url: post.hero_url, meta_description: seo.meta_description,
      });
      await sb.from("psy_blog_posts").update({
        meta_description: seo.meta_description,
        og_title: seo.og_title,
        meta_keywords: seo.meta_keywords,
        og_image_url: post.hero_url,
        schema_article: schema,
        internal_links: seo.internal_links,
        seo_status: "ready",
      }).eq("id", post.id);
      results.push({ id: post.id, ok: true });
    } catch (e) {
      await sb.from("psy_blog_posts").update({ seo_status: "failed", seo_error: (e as Error).message.slice(0, 240) }).eq("id", post.id);
      results.push({ id: post.id, ok: false, error: (e as Error).message });
    }
  }
  return NextResponse.json({ ok: true, processed: results.length, results });
}
