/* Helpers de dates en francais, pour afficher des echeances lisibles
   ("Aujourd'hui", "Demain", "En retard de 2 jours") plutot que des dates brutes. */

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janv.", "fevr.", "mars", "avr.", "mai", "juin", "juil.", "aout", "sept.", "oct.", "nov.", "dec."];

export function todayISO(): string {
  const d = new Date();
  // Construit la date en heure locale : toISOString() basculerait en UTC et pourrait
  // decaler d'un jour selon le fuseau.
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Nombre de jours entre aujourd'hui et la date donnee (negatif = passe). */
export function daysUntil(iso: string): number {
  const target = parseISO(iso).getTime();
  const now = parseISO(todayISO()).getTime();
  return Math.round((target - now) / 86400000);
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Libelle court et humain pour une echeance. */
export function formatDue(iso: string): string {
  const diff = daysUntil(iso);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  if (diff === -1) return "Hier";
  if (diff < -1) return `En retard de ${-diff} jours`;
  if (diff < 7) {
    const d = parseISO(iso);
    return capitalize(JOURS[d.getDay()] ?? "");
  }
  const d = parseISO(iso);
  return `${d.getDate()} ${MOIS[d.getMonth()] ?? ""}`;
}

/** Cle de regroupement d'une liste de taches par echeance. */
export type DueBucket = "retard" | "aujourdhui" | "demain" | "semaine" | "plus-tard" | "sans-date";

export const BUCKET_LABELS: Record<DueBucket, { label: string; icon: string }> = {
  retard: { label: "En retard", icon: "🔴" },
  aujourdhui: { label: "Aujourd'hui", icon: "⭐" },
  demain: { label: "Demain", icon: "🌤️" },
  semaine: { label: "Cette semaine", icon: "📅" },
  "plus-tard": { label: "Plus tard", icon: "🗓️" },
  "sans-date": { label: "Sans echeance", icon: "📥" },
};

export const BUCKET_ORDER: DueBucket[] = ["retard", "aujourdhui", "demain", "semaine", "plus-tard", "sans-date"];

export function bucketOf(dueDate: string | null): DueBucket {
  if (!dueDate) return "sans-date";
  const diff = daysUntil(dueDate);
  if (diff < 0) return "retard";
  if (diff === 0) return "aujourdhui";
  if (diff === 1) return "demain";
  if (diff <= 7) return "semaine";
  return "plus-tard";
}

/** Salutation adaptee a l'heure, pour l'accueil. */
export function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon apres-midi";
  return "Bonsoir";
}

/** Date du jour en toutes lettres : "samedi 13 septembre". */
export function todayLong(): string {
  const d = new Date();
  const mois = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];
  return `${JOURS[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]}`;
}
