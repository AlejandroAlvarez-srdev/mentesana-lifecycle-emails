// Carga/guarda los overrides de copy de los correos de upsell (tabla
// upsell_copy_overrides en el Supabase "blog"). Lo usa el runner (para enviar
// con la copy editada) y el preview/editor.
import { blogClient } from "@/lib/flujos-auto";
import type { CopyMap } from "@/lib/emails/upsell-post-sesion";

export async function loadUpsellCopy(): Promise<CopyMap> {
  try {
    const sb = blogClient();
    const { data } = await sb
      .from("upsell_copy_overrides")
      .select("template_id, subject, kicker, titular, intro");
    const map: CopyMap = {};
    for (const r of (data ?? []) as Array<{
      template_id: string;
      subject: string | null;
      kicker: string | null;
      titular: string | null;
      intro: string | null;
    }>) {
      map[r.template_id] = {
        subject: r.subject ?? undefined,
        kicker: r.kicker ?? undefined,
        titular: r.titular ?? undefined,
        intro: r.intro ?? undefined,
      };
    }
    return map;
  } catch {
    return {};
  }
}

export async function saveUpsellCopy(
  id: string,
  fields: { subject?: string; kicker?: string; titular?: string; intro?: string },
): Promise<boolean> {
  try {
    const sb = blogClient();
    const { error } = await sb.from("upsell_copy_overrides").upsert(
      {
        template_id: id,
        subject: fields.subject ?? null,
        kicker: fields.kicker ?? null,
        titular: fields.titular ?? null,
        intro: fields.intro ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "template_id" },
    );
    return !error;
  } catch {
    return false;
  }
}
