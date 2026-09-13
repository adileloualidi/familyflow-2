// Logique metier pure (sans dependance Firestore) -> facile a tester unitairement.
import type { Member, Task } from "@/types";

export function todayStr(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

/** Calcule le nouveau streak (serie de jours consecutifs) d'un membre qui vient de terminer une tache. */
export function computeStreak(member: Pick<Member, "lastDoneDate" | "streak">, today = todayStr()): number {
  if (!member.lastDoneDate) return 1;
  const gap = daysBetween(member.lastDoneDate, today);
  if (gap === 0) return member.streak || 1;
  if (gap === 1) return (member.streak || 0) + 1;
  return 1;
}

export interface AssignScore {
  member: Member;
  score: number;
  reasons: string[];
}

/**
 * Repartition equitable des taches (mode IA).
 * Analyse: age minimum requis, charge actuelle (points des taches ouvertes),
 * frequence recente sur le meme groupe, disponibilite du jour, competences,
 * preferences, et equite historique (nombre total de taches faites).
 * Retourne les membres eligibles tries du meilleur au moins bon score.
 */
export function computeAutoAssignScores(
  task: Pick<Task, "group" | "minAge" | "points">,
  members: Member[],
  tasks: Task[],
  now: Date = new Date()
): AssignScore[] {
  const weekday = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"][now.getDay()];
  const eligible = members.filter((m) => m.status === "active" && m.role !== "guest");
  const maxDone = Math.max(1, ...members.map((m) => m.tasksDone || 0));

  return eligible
    .map((m): AssignScore => {
      const reasons: string[] = [];
      if (task.minAge != null) {
        if (m.age == null || m.age < task.minAge) {
          return { member: m, score: -9999, reasons: ["Age insuffisant"] };
        }
        reasons.push("Age compatible");
      }
      let score = 0;
      const openTasks = tasks.filter(
        (t) => t.assigneeId === m.id && ["A faire", "En attente", "En cours", "A valider"].includes(t.status)
      );
      const load = openTasks.reduce((s, t) => s + (t.points || 0), 0);
      score -= load * 0.6;
      if (load > 0) reasons.push(`Charge actuelle: ${load} pts`);

      const recentSame = tasks.filter(
        (t) =>
          t.assigneeId === m.id &&
          t.group === task.group &&
          t.status === "Terminee" &&
          t.completedAt &&
          daysBetween(t.completedAt, now.toISOString()) < 7
      ).length;
      score -= recentSame * 4;
      if (recentSame > 0) reasons.push(`Deja fait ${recentSame}x cette semaine (${task.group})`);

      if (m.availability && m.availability.length) {
        if (m.availability.includes(weekday)) {
          score += 6;
          reasons.push(`Disponible ${weekday}`);
        } else {
          score -= 3;
        }
      }
      if (task.group && m.skills?.includes(task.group)) {
        score += 8;
        reasons.push(`Competence: ${task.group}`);
      }
      if (task.group && m.preferences?.includes(task.group)) {
        score += 5;
        reasons.push(`Preference: ${task.group}`);
      }
      score += (1 - (m.tasksDone || 0) / maxDone) * 5;

      return { member: m, score: Math.round(score * 10) / 10, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

const BADGE_DEFS = [
  { id: "tasks10", check: (m: Pick<Member, "tasksDone">) => (m.tasksDone || 0) >= 10 },
  { id: "tasks100", check: (m: Pick<Member, "tasksDone">) => (m.tasksDone || 0) >= 100 },
  { id: "streak7", check: (m: Pick<Member, "streak">) => (m.streak || 0) >= 7 },
  { id: "streak30", check: (m: Pick<Member, "streak">) => (m.streak || 0) >= 30 },
] as const;

export function newlyEarnedBadges(
  before: Pick<Member, "tasksDone" | "streak" | "badges">,
  after: Pick<Member, "tasksDone" | "streak">
): string[] {
  const already = before.badges || [];
  return BADGE_DEFS.filter((b) => b.check(after) && !already.includes(b.id)).map((b) => b.id);
}
