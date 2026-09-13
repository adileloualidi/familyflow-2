"use client";

import { useState } from "react";
import type { Member, Task } from "@/types";
import { setTaskStatus } from "@/lib/firestore-helpers";
import { formatDue, daysUntil } from "@/lib/dates";

const DIFFICULTY_COLOR: Record<string, string> = {
  facile: "var(--success)",
  moyen: "var(--warning)",
  difficile: "var(--danger)",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

/**
 * Ligne de tache : case a cocher circulaire, titre, metadonnees discretes,
 * avatar de l'assigne. Cocher fait avancer la tache d'un cran plutot que de la
 * terminer d'autorite — une tache d'enfant passe par « A valider », un admin
 * valide directement.
 */
export function TaskRow({
  task,
  members,
  activeMember,
  isAdmin,
  familyId,
  onOpen,
}: {
  task: Task;
  members: Member[];
  activeMember: Member;
  isAdmin: boolean;
  familyId: string;
  onOpen: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const assignee = members.find((m) => m.id === task.assigneeId) ?? null;
  const done = task.status === "Terminee";
  const awaiting = task.status === "A valider";
  const mine = task.assigneeId === activeMember.id;
  const canAct = mine || isAdmin;
  const subDone = task.subtasks.filter((s) => s.done).length;

  async function handleCheck(e: React.MouseEvent | React.ChangeEvent) {
    e.stopPropagation();
    if (!canAct || busy || done) return;
    setBusy(true);
    try {
      // Un admin valide d'un clic ; les autres demandent la validation.
      await setTaskStatus(familyId, task, isAdmin ? "Terminee" : "A valider", activeMember.id);
    } finally {
      setBusy(false);
    }
  }

  const late = task.dueDate && daysUntil(task.dueDate) < 0 && !done;
  const dueToday = task.dueDate && daysUntil(task.dueDate) === 0 && !done;

  return (
    <div className={`task-row ${done ? "task-done" : ""} ${busy ? "task-completing" : ""}`}>
      <label
        className={`check ${awaiting ? "pending" : ""} mt-0.5`}
        onClick={(e) => e.stopPropagation()}
        title={
          !canAct
            ? "Cette tache est assignee a quelqu'un d'autre"
            : done
              ? "Tache terminee"
              : isAdmin
                ? "Marquer comme terminee"
                : "Demander la validation"
        }
      >
        <input type="checkbox" checked={done} disabled={!canAct || busy || done} onChange={handleCheck} aria-label={`Terminer ${task.title}`} />
        <span className="box">
          <svg viewBox="0 0 16 16" aria-hidden>
            <polyline points="2.5,8.5 6.5,12 13.5,4" />
          </svg>
        </span>
      </label>

      <button className="flex-1 min-w-0 text-left" onClick={onOpen}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="dot" style={{ background: DIFFICULTY_COLOR[task.difficulty] ?? "var(--border-strong)" }} title={task.difficulty} />
          <span className="task-title font-semibold text-[0.9375rem] leading-snug">{task.title}</span>
          {awaiting && <span className="badge warning">A valider</span>}
          {task.status === "En cours" && <span className="badge info">En cours</span>}
          {task.status === "Refusee" && <span className="badge danger">Refusee</span>}
        </div>

        <div className="flex items-center gap-2.5 mt-1 flex-wrap text-[0.6875rem] text-ink-faint font-semibold">
          {task.dueDate && (
            <span style={late ? { color: "var(--danger)" } : dueToday ? { color: "var(--section)" } : undefined}>
              {late ? "⚠ " : ""}
              {formatDue(task.dueDate)}
            </span>
          )}
          <span>{task.group}</span>
          {task.estimatedMinutes > 0 && <span>{task.estimatedMinutes} min</span>}
          {task.subtasks.length > 0 && (
            <span>
              ☑ {subDone}/{task.subtasks.length}
            </span>
          )}
          {task.comments.length > 0 && <span>💬 {task.comments.length}</span>}
        </div>
      </button>

      <div className="flex items-center gap-2 shrink-0 mt-0.5">
        <span className="badge accent tabular">{task.points} pts</span>
        {assignee ? (
          <span
            className="avatar w-7 h-7 text-[0.625rem]"
            style={{ background: `linear-gradient(135deg, ${assignee.color || "var(--brand)"}, color-mix(in srgb, ${assignee.color || "var(--brand)"} 60%, #fff))` }}
            title={assignee.name}
          >
            {initials(assignee.name)}
          </span>
        ) : (
          <span className="avatar w-7 h-7 text-[0.625rem] !text-ink-faint" style={{ background: "var(--surface-3)" }} title="Non assignee">
            ?
          </span>
        )}
      </div>
    </div>
  );
}

export { initials };
