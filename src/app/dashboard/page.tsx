"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AppShell, EmptyState, PageHeader } from "@/components/AppShell";
import { TaskRow, initials } from "@/components/TaskRow";
import { useAuth } from "@/context/AuthContext";
import { greeting, todayISO, todayLong } from "@/lib/dates";

const CLOSED = ["Terminee", "Annulee", "Refusee"];

export default function DashboardPage() {
  const { familyId, members, tasks, inventory, shopping, activeMemberId } = useAuth();
  const me = members.find((m) => m.id === activeMemberId) ?? null;
  const isAdmin = me?.role === "admin";
  const today = todayISO();

  const stats = useMemo(() => {
    const open = tasks.filter((t) => !CLOSED.includes(t.status));
    const dueToday = open.filter((t) => t.dueDate === today);
    const late = open.filter((t) => t.dueDate && t.dueDate < today);
    const doneToday = tasks.filter((t) => t.completedAt && t.completedAt.slice(0, 10) === today);
    const plannedToday = dueToday.length + doneToday.length;
    return {
      open,
      dueToday,
      late,
      doneToday,
      // Progression du jour : part de ce qui etait prevu aujourd'hui et qui est fait.
      progress: plannedToday > 0 ? Math.round((doneToday.length / plannedToday) * 100) : 0,
      awaiting: tasks.filter((t) => t.status === "A valider").length,
      lowStock: inventory.filter((i) => i.qty <= i.threshold).length,
      toBuy: shopping.filter((s) => !s.done).length,
    };
  }, [tasks, inventory, shopping, today]);

  const myTasks = useMemo(() => {
    if (!me) return [];
    return tasks
      .filter((t) => t.assigneeId === me.id && !CLOSED.includes(t.status))
      .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"))
      .slice(0, 5);
  }, [tasks, me]);

  const ranking = useMemo(
    () =>
      members
        .filter((m) => m.role !== "guest" && m.status === "active")
        .slice()
        .sort((a, b) => (b.totalPointsEarned || 0) - (a.totalPointsEarned || 0))
        .slice(0, 5),
    [members]
  );

  if (!familyId || !me) return null;

  const topScore = ranking[0]?.totalPointsEarned || 0;

  return (
    <AppShell>
      <PageHeader eyebrow={todayLong()} title={`${greeting()}, ${me.name.split(" ")[0]}`} subtitle="Voici l'etat de la maison aujourd'hui." />

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {/* Progression du jour */}
        <div className="card card-lg flex items-center gap-5 animate-in">
          <ProgressRing value={stats.progress} />
          <div className="min-w-0">
            <p className="eyebrow">Journee</p>
            <p className="title-lg mt-1">
              {stats.doneToday.length}
              <span className="text-ink-faint font-bold">/{stats.dueToday.length + stats.doneToday.length}</span>
            </p>
            <p className="text-xs text-ink-dim mt-1">
              {stats.dueToday.length === 0 && stats.doneToday.length === 0
                ? "Rien de prevu aujourd'hui"
                : stats.dueToday.length === 0
                  ? "Tout est boucle 🎉"
                  : `${stats.dueToday.length} restante${stats.dueToday.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Alertes */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile href="/tasks" icon="🔥" label="En retard" value={stats.late.length} tone={stats.late.length > 0 ? "bad" : undefined} />
          <StatTile href="/tasks" icon="⏳" label="A valider" value={stats.awaiting} tone={stats.awaiting > 0 ? "warn" : undefined} />
          <StatTile href="/shopping" icon="🛒" label="A acheter" value={stats.toBuy} />
          <StatTile href="/stock" icon="📦" label="Stock bas" value={stats.lowStock} tone={stats.lowStock > 0 ? "bad" : undefined} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Mes taches */}
        <div className="card card-lg lg:col-span-2 animate-in">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h2 className="title">Mes prochaines taches</h2>
            <Link href="/tasks" className="text-xs font-bold" style={{ color: "var(--section)" }}>
              Tout voir →
            </Link>
          </div>
          {myTasks.length === 0 ? (
            <EmptyState icon="🎉" title="Aucune tache en cours" hint="Profite du calme, ou prends-en une dans la liste commune." />
          ) : (
            <div className="mt-1">
              {myTasks.map((t) => (
                <TaskRow key={t.id} task={t} members={members} activeMember={me} isAdmin={!!isAdmin} familyId={familyId} onOpen={() => {}} />
              ))}
            </div>
          )}
        </div>

        {/* Classement */}
        <div className="card card-lg animate-in">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="title">Classement</h2>
            <Link href="/rewards" className="text-xs font-bold" style={{ color: "var(--section)" }}>
              Recompenses →
            </Link>
          </div>
          {ranking.length === 0 ? (
            <EmptyState icon="🏆" title="Pas encore de points" />
          ) : (
            <div className="flex flex-col gap-3">
              {ranking.map((m, i) => {
                const pts = m.totalPointsEarned || 0;
                const pct = topScore > 0 ? (pts / topScore) * 100 : 0;
                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <span className="w-5 text-center text-xs font-extrabold text-ink-faint tabular">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </span>
                    <span
                      className="avatar w-8 h-8 text-[0.6875rem]"
                      style={{ background: `linear-gradient(135deg, ${m.color || "var(--brand)"}, color-mix(in srgb, ${m.color || "var(--brand)"} 60%, #fff))` }}
                    >
                      {initials(m.name)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-sm font-bold truncate">{m.name}</span>
                        <span className="text-xs font-extrabold tabular shrink-0">{pts}</span>
                      </div>
                      <div className="meter mt-1.5">
                        <span style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function StatTile({ href, icon, label, value, tone }: { href: string; icon: string; label: string; value: number; tone?: "bad" | "warn" }) {
  const color = tone === "bad" ? "var(--danger)" : tone === "warn" ? "var(--warning)" : undefined;
  const bg = tone === "bad" ? "var(--danger-soft)" : tone === "warn" ? "var(--warning-soft)" : "var(--section-soft)";
  return (
    <Link href={href} className="card card-interactive flex flex-col justify-between gap-2 animate-in">
      <span className="w-9 h-9 rounded-xl grid place-items-center text-base" style={{ background: bg }} aria-hidden>
        {icon}
      </span>
      <div>
        <div className="text-2xl font-extrabold tabular leading-none" style={color ? { color } : undefined}>
          {value}
        </div>
        <div className="text-[0.6875rem] font-bold text-ink-faint mt-1">{label}</div>
      </div>
    </Link>
  );
}

function ProgressRing({ value }: { value: number }) {
  const size = 96;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="ring" width={size} height={size} aria-hidden>
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--section)" />
            <stop offset="100%" stopColor="var(--section-2)" />
          </linearGradient>
        </defs>
        <circle className="track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle
          className="value"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-lg font-extrabold tabular">{value}%</span>
      </div>
    </div>
  );
}
