"use client";

import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const { members, tasks, activeMemberId } = useAuth();
  const me = members.find((m) => m.id === activeMemberId) ?? null;
  const today = todayStr();

  const openTasks = tasks.filter((t) => !["Terminee", "Annulee", "Refusee"].includes(t.status));
  const late = openTasks.filter((t) => t.dueDate && t.dueDate < today);
  const doneToday = tasks.filter((t) => t.completedAt && t.completedAt.slice(0, 10) === today);
  const successRate = tasks.length ? Math.round((100 * tasks.filter((t) => t.status === "Terminee").length) / tasks.length) : 0;
  const ranking = members
    .filter((m) => m.role !== "guest")
    .slice()
    .sort((a, b) => (b.totalPointsEarned || 0) - (a.totalPointsEarned || 0))
    .slice(0, 5);
  const myTasks = me ? tasks.filter((t) => t.assigneeId === me.id && !["Terminee", "Annulee"].includes(t.status)).slice(0, 6) : [];

  return (
    <AppShell>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Taches du jour" value={openTasks.filter((t) => t.dueDate === today).length} />
        <Stat label="En retard" value={late.length} danger />
        <Stat label="Terminees aujourd'hui" value={doneToday.length} ok />
        <Stat label="Taux de reussite" value={successRate + "%"} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-bold mb-2">Mes taches</h3>
          {myTasks.length === 0 && <p className="text-sm opacity-60">Aucune tache en cours 🎉</p>}
          {myTasks.map((t) => (
            <div key={t.id} className="flex justify-between items-center py-2 border-b border-[var(--border)] text-sm">
              <span>{t.title}</span>
              <span className="opacity-60">{t.points} pts</span>
            </div>
          ))}
          <Link href="/tasks" className="text-accent text-sm font-bold block mt-2">
            Voir toutes mes taches →
          </Link>
        </div>

        <div className="card">
          <h3 className="font-bold mb-2">Classement familial</h3>
          {ranking.map((m, i) => (
            <div key={m.id} className="flex justify-between items-center py-2 border-b border-[var(--border)] text-sm">
              <span>
                #{i + 1} {m.name}
              </span>
              <b>{m.totalPointsEarned || 0} pts</b>
            </div>
          ))}
          {ranking.length === 0 && <p className="text-sm opacity-60">Pas encore de donnees</p>}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, danger, ok }: { label: string; value: number | string; danger?: boolean; ok?: boolean }) {
  return (
    <div className="card">
      <div className="text-[11px] font-bold uppercase opacity-60">{label}</div>
      <div className={`text-2xl font-extrabold ${danger ? "text-red-500" : ok ? "text-emerald-600" : ""}`}>{value}</div>
    </div>
  );
}
