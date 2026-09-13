"use client";

import { useState } from "react";
import type { Member, Task, TaskStatus } from "@/types";
import { setTaskStatus, updateTask } from "@/lib/firestore-helpers";
import { VoiceButton } from "@/components/VoiceInput";
import { initials } from "@/components/TaskRow";
import { formatDue, daysUntil } from "@/lib/dates";

interface Props {
  familyId: string;
  task: Task;
  members: Member[];
  activeMember: Member;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: () => void;
}

const STATUS_TONE: Record<TaskStatus, string> = {
  "A faire": "",
  "En cours": "info",
  "En attente": "",
  "A valider": "warning",
  Terminee: "success",
  Refusee: "danger",
  Annulee: "",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  facile: "var(--success)",
  moyen: "var(--warning)",
  difficile: "var(--danger)",
};

export function TaskDetailModal({ familyId, task, members, activeMember, isAdmin, onClose, onEdit }: Props) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const assignee = members.find((m) => m.id === task.assigneeId) ?? null;
  const mine = task.assigneeId === activeMember.id;
  const canAct = mine || isAdmin;
  const late = task.dueDate && daysUntil(task.dueDate) < 0 && task.status !== "Terminee";
  const subDone = task.subtasks.filter((s) => s.done).length;
  const subPct = task.subtasks.length > 0 ? (subDone / task.subtasks.length) * 100 : 0;

  async function changeStatus(status: TaskStatus) {
    if (busy) return;
    setBusy(true);
    try {
      await setTaskStatus(familyId, task, status, activeMember.id);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function toggleSubtask(idx: number) {
    const sub = task.subtasks.slice();
    sub[idx] = { ...sub[idx]!, done: !sub[idx]!.done };
    await updateTask(familyId, task.id, { subtasks: sub });
  }

  async function sendComment(text?: string) {
    const value = (text ?? comment).trim();
    if (!value) return;
    const comments = [...task.comments, { memberId: activeMember.id, text: value, at: new Date().toISOString() }];
    await updateTask(familyId, task.id, { comments });
    setComment("");
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: "rgba(20, 14, 8, 0.45)", backdropFilter: "blur(3px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="card card-lg w-full max-w-lg max-h-[88vh] overflow-auto shadow-xl animate-in">
        <div className="flex justify-between items-start gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`badge ${STATUS_TONE[task.status]}`}>{task.status}</span>
              <span className="badge accent tabular">{task.points} pts</span>
              <span className="badge">
                <span className="dot" style={{ background: DIFFICULTY_COLOR[task.difficulty] }} />
                {task.difficulty}
              </span>
            </div>
            <h2 className="title-lg">{task.title}</h2>
          </div>
          <button className="btn icon ghost shrink-0" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        {task.description && <p className="text-sm text-ink-dim leading-relaxed mb-4">{task.description}</p>}

        {/* Metadonnees */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          <Fact label="Assignee a" value={assignee?.name ?? "Personne"} member={assignee} />
          <Fact label="Echeance" value={task.dueDate ? formatDue(task.dueDate) : "—"} tone={late ? "var(--danger)" : undefined} />
          <Fact label="Groupe" value={task.group} />
          <Fact label="Duree" value={`${task.estimatedMinutes} min`} />
        </div>

        {/* Sous-taches */}
        {task.subtasks.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="title">Sous-taches</h3>
              <span className="text-xs font-bold text-ink-faint tabular">
                {subDone}/{task.subtasks.length}
              </span>
            </div>
            <div className="meter mb-2">
              <span style={{ width: `${subPct}%` }} />
            </div>
            {task.subtasks.map((s, i) => (
              <div key={s.id} className="row !py-2">
                <label className="check">
                  <input type="checkbox" checked={s.done} disabled={!canAct} onChange={() => toggleSubtask(i)} aria-label={s.label} />
                  <span className="box">
                    <svg viewBox="0 0 16 16" aria-hidden>
                      <polyline points="2.5,8.5 6.5,12 13.5,4" />
                    </svg>
                  </span>
                </label>
                <span className={`text-sm flex-1 ${s.done ? "line-through text-ink-faint" : ""}`}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Commentaires */}
        <div className="mb-5">
          <h3 className="title mb-2">Commentaires</h3>
          <div className="max-h-40 overflow-auto flex flex-col gap-2 mb-3">
            {task.comments.map((c, i) => {
              const cm = members.find((m) => m.id === c.memberId);
              return (
                <div key={i} className="flex gap-2.5">
                  <span
                    className="avatar w-7 h-7 text-[0.625rem] shrink-0"
                    style={{ background: `linear-gradient(135deg, ${cm?.color ?? "var(--brand)"}, color-mix(in srgb, ${cm?.color ?? "var(--brand)"} 60%, #fff))` }}
                  >
                    {initials(cm?.name ?? "?")}
                  </span>
                  <div className="rounded-xl px-3 py-2 text-sm min-w-0" style={{ background: "var(--surface-2)" }}>
                    <span className="font-bold text-xs block mb-0.5">{cm?.name ?? "?"}</span>
                    {c.text}
                  </div>
                </div>
              );
            })}
            {task.comments.length === 0 && <p className="text-xs text-ink-faint">Aucun commentaire pour l'instant.</p>}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="!mb-0"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ajouter un commentaire…"
              onKeyDown={(e) => e.key === "Enter" && sendComment()}
            />
            <VoiceButton onResult={(t) => sendComment(t)} label="" className="icon shrink-0" />
            <button className="btn shrink-0" onClick={() => sendComment()} disabled={!comment.trim()}>
              Envoyer
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-line">
          {canAct && task.status === "A faire" && (
            <button className="btn primary" onClick={() => changeStatus("En cours")} disabled={busy}>
              Commencer
            </button>
          )}
          {canAct && task.status === "En cours" && (
            <>
              <button className="btn" onClick={() => changeStatus("En attente")} disabled={busy}>
                Suspendre
              </button>
              <button
                className="btn"
                style={{ background: "var(--success)", color: "#fff", borderColor: "transparent" }}
                onClick={() => changeStatus(isAdmin ? "Terminee" : "A valider")}
                disabled={busy}
              >
                {isAdmin ? "Terminer" : "Demander validation"}
              </button>
            </>
          )}
          {canAct && task.status === "En attente" && (
            <button className="btn primary" onClick={() => changeStatus("En cours")} disabled={busy}>
              Reprendre
            </button>
          )}
          {isAdmin && task.status === "A valider" && (
            <>
              <button
                className="btn"
                style={{ background: "var(--success)", color: "#fff", borderColor: "transparent" }}
                onClick={() => changeStatus("Terminee")}
                disabled={busy}
              >
                Valider ✓
              </button>
              <button className="btn danger" onClick={() => changeStatus("Refusee")} disabled={busy}>
                Refuser
              </button>
            </>
          )}
          {canAct && !["Terminee", "Annulee"].includes(task.status) && (
            <button className="btn ghost" onClick={() => changeStatus("Annulee")} disabled={busy}>
              Annuler la tache
            </button>
          )}
          {isAdmin && (
            <button className="btn ghost ml-auto" onClick={onEdit}>
              Modifier
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value, tone, member }: { label: string; value: string; tone?: string; member?: Member | null }) {
  return (
    <div className="p-2.5 rounded-xl" style={{ background: "var(--surface-2)" }}>
      <div className="text-[0.625rem] font-extrabold text-ink-faint uppercase tracking-wide">{label}</div>
      <div className="flex items-center gap-1.5 mt-1">
        {member && (
          <span
            className="avatar w-5 h-5 text-[0.5rem]"
            style={{ background: `linear-gradient(135deg, ${member.color}, color-mix(in srgb, ${member.color} 60%, #fff))` }}
          >
            {initials(member.name)}
          </span>
        )}
        <span className="text-sm font-bold truncate" style={tone ? { color: tone } : undefined}>
          {value}
        </span>
      </div>
    </div>
  );
}
