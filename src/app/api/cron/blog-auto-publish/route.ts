// Cron: dispara publish para drafts con scheduled_for vencido.
import { NextRequest, NextResponse } from "next/server";
import { psyBlogSb, BLOG_TABLE, contentHash, publishIdempotencyKey, generateBlogHero, buildHeroPrompt } from "@/lib/psy-blog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const sb = psyBlogSb();
  const due = await sb
    .from(BLOG_TABLE)
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(5);
  if (due.error) return NextResponse.json({ error: due.error.message }, { status: 500 });
  if (!due.data || due.data.length === 0) return NextResponse.json({ ok: true, processed: 0 });

  const results: Array<{ id: number; ok: boolean; error?: string }> = [];
  for (const post of due.data) {
    try {
      const cHash = contentHash(post.title, post.body_md ?? "");
      const idemKey = publishIdempotencyKey(post.provider_id, cHash);
      const lock = await sb
        .from(BLOG_TABLE)
        .update({
          status: "publishing",
          content_hash: cHash,
          publish_idempotency_key: idemKey,
          hero_status: "generating",
          hero_prompt: buildHeroPrompt(post.title),
          publish_attempts: (post.publish_attempts ?? 0) + 1,
        })
        .eq("id", post.id)
        .eq("status", "scheduled")
        .select()
        .maybeSingle();
      if (!lock.data) { results.push({ id: post.id, ok: false, error: "lock_skipped" }); continue; }

      let heroUrl: string | null = null;
      let heroError: string | null = null;
      try { heroUrl = await generateBlogHero(buildHeroPrompt(post.title), lock.data.slug); }
      catch (e) { heroError = (e as Error).message.slice(0, 240); }

      await sb.from(BLOG_TABLE).update({
        status: "published",
        publish_date: new Date().toISOString(),
        hero_image: heroUrl,
        og_image: heroUrl,
        hero_image_alt: post.title,
        hero_status: heroUrl ? "ready" : "failed",
        hero_error: heroError,
        seo_status: "pending",
      }).eq("id", post.id);

      // Liga la keyword del universo al post recién publicado
      if (post.keyword) {
        await sb.from("blog_keyword_universe").update({
          status: "published",
          post_id: post.id,
          lock_expires_at: null,
        }).eq("keyword", post.keyword);
      }

      results.push({ id: post.id, ok: true });
    } catch (e) {
      await sb.from(BLOG_TABLE).update({
        status: "failed",
        publish_error: (e as Error).message.slice(0, 300),
      }).eq("id", post.id);
      results.push({ id: post.id, ok: false, error: (e as Error).message });
    }
  }
  return NextResponse.json({ ok: true, processed: results.length, results });
}
