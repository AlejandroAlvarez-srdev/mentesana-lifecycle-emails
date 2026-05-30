// Lista de slugs de psicólogas con foto poster disponible en
// /public/images/psicologas-posters/. Usado por los emails para decidir
// si renderizan la foto real o el avatar de iniciales como fallback.
//
// Para añadir una nueva psicóloga al set:
//   1. Ejecuta `npm run psi-posters:build` (o el script que extrae
//      el primer frame de su vídeo welcome).
//   2. Añade el slug aquí.
//
// Mantener este array es preferible a un fs.readdir() en runtime porque
// los emails se renderizan en el edge / en serverless donde el filesystem
// puede no contener los assets de public/ en algunos casos, y porque así
// evitamos imágenes rotas en producción.
export const PSI_PHOTO_SLUGS = new Set<string>([
  "adriana-salas",
  "alexa-vargas",
  "alexandra-elias",
  "alexandra-nassif",
  "antonella-matinella",
  "barbara-pargas",
  "brenda-castillo",
  "carolina-prudencio",
  "cindy-duque",
  "diana-estrada-mora",
  "diana-salazar-alzate",
  "gabriela-delgado",
  "greslimar-padilla",
  "jose-alejandro-garcia",
  "juliana-urioste",
  "laura-acosta-acosta",
  "lesly-hilario",
  "mallerly-mesa",
  "maria-alejandra-quintero",
  "maria-fernanda-mogollon-mendez",
  "maria-infante",
  "marlen-pastran",
  "mary-stephany-prieto",
  "melanie-camejo",
  "monica-guiza",
  "nurys-gabriela-puerta",
  "ronysmar-rodriguez",
  "rosana-juarez",
  "selene-oropeza",
  "tatiana-castro",
  "wilder-adames",
  "yeris-loraine-silva",
  "yined-rios",
  "yldamar-katerine-pereira",
  "yohaira-espinoza",
]);

export const PSI_POSTERS_BASE = "https://mentesanapsicologia.com/images/psicologas-posters";

export function slugifyPsiName(name: string): string {
  return (name || "")
    .toLowerCase()
    .normalize("NFD")
    // Eliminar combining diacritical marks (acentos, virgulilla, etc.)
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// Resuelve la URL de la foto SOLO si el slug existe en la whitelist.
// Hace match exacto y, si no, match parcial por nombre+primer apellido
// ("Diana Salazar" → "diana-salazar-alzate").
export function resolvePsiPhotoUrl(name: string): string | null {
  if (!name) return null;
  const slug = slugifyPsiName(name);
  if (!slug) return null;
  if (PSI_PHOTO_SLUGS.has(slug)) return `${PSI_POSTERS_BASE}/${slug}.jpg`;
  // Match parcial: si lo recibido tiene 1-2 partes y existe un slug que
  // empiece por ese prefijo, lo usamos. Evita falsos positivos exigiendo
  // que el prefijo tenga al menos un guion (nombre + apellido).
  if (slug.includes("-")) {
    const match = [...PSI_PHOTO_SLUGS].find((k) => k.startsWith(`${slug}-`) || k === slug);
    if (match) return `${PSI_POSTERS_BASE}/${match}.jpg`;
  }
  return null;
}
