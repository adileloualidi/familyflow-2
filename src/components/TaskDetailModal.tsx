"use client";

import { useState } from "react";
import type { Member, Task, TaskStatus } from "@/types";
import { setTaskStatus, updateTask } from "@/lib/firestore-helpers";

interface Props {
  familyId: string;
  task: Task;
  members: Member[];
  activeMember: Member;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function TaskDetailModal({ familyId, task, members, activeMember, isAdmin, onClose, onEdit }: Props) {
  const [comment, setComment] = useState("");
  const assignee = members.find((m) => m.id === task.assigneeId) ?? null;
  const mine = task.assigneeId === activeMember.id;
  const canAct = mine || isAdmin;

  async function changeStatus(status: TaskStatus) {
    await setTaskStatus(familyId, task, status, activeMember.id);
    onClose();
  }

  async function toggleSubtask(idx: number) {
    const sub = task.subtasks.slice();
    sub[idx] = { ...sub[idx], done: !sub[idx].done };
    await updateTask(familyId, task.id, { subtasks: sub });
  }

  async function sendComment() {
    if (!comment.trim()) return;
    const comments = [...task.comments, { memberId: activeMember.id, text: comment.trim(), at: new Date().toISOString() }];
    await updateTask(familyId, task.id, { comments });
    setComment("");
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card w-full max-w-lg max-h-[88vh] overflow-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg">{task.title}</h3>
          <button className="opacity-60 text-lg" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-[var(--surface-2)] font-bold">{task.status}</span>
          <span className="px-2 py-1 rounded-full bg-[var(--surface-2)] font-bold">{task.group}</span>
          <span className="px-2 py-1 rounded-full bg-[var(--surface-2)] font-bold">{task.points} pts</span>
          {task.dueDate && <span className="px-2 py-1 rounded-full bg-[var(--surface-2)] font-bold">📅 {task.dueDate}</span>}
        </div>

        {task.description && <p className="text-sm opacity-70 mb-2">{task.description}</p>}
        <p className="text-sm mb-3">{assignee ? `Assignee a ${assignee.name}` : "Non assignee"}</p>

        {task.subtasks.length > 0 && (
          <div className="mb-3">
            <b className="text-sm">Sous-taches</b>
            {task.subtasks.map((s, i) => (
              <label key={s.id} className="flex items-center gap-2 text-sm py-1">
                <input type="checkbox" checked={s.done} disabled={!canAct} onChange={() => toggleSubtask(i)} />
                <span className={s.done ? "line-through opacity-60" : ""}>{s.label}</span>
              </label>
            ))}
          </div>
        )}

        <div className="mb-3">
          <b className="text-sm">Commentaires</b>
          <div className="max-h-28 overflow-auto flex flex-col gap-1 my-2">
            {task.comments.map((c, i) => {
              const cm = members.find((m) => m.id === c.memberId);
              return (
                <div key={i} className="text-xs bg-[var(--surface-2)] rounded-lg px-2 py-1">
                  <b>{cm?.name ?? "?"} :</b> {c.text}
                </div>
              );
            })}
            {task.comments.length === 0 && <span className="text-xs opacity-60">Aucun commentaire</span>}
          </div>
          <div className="flex gap-2">
            <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ajouter un commentaire…" className="!mb-0" />
            <button className="btn text-xs" onClick={sendComment}>
              Envoyer
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {canAct && task.status === "A faire" && (
            <button className="btn primary text-xs" onClick={() => changeStatus("En cours")}>
              Commencer
            </button>
          )}
          {canAct && task.status === "En cours" && (
            <>
              <button className="btn text-xs" onClick={() => changeStatus("En attente")}>
                Suspendre
              </button>
              <button className="btn text-xs bg-emerald-600 text-white border-emerald-600" onClick={() => changeStatus("A valider")}>
                Demander validation
              </button>
            </>
          )}
          {canAct && task.status === "En attente" && (
            <button className="btn primary text-xs" onClick={() => changeStatus("En cours")}>
              Reprendre
            </button>
          )}
          {isAdmin && task.status === "A valider" && (
            <>
              <button className="btn text-xs bg-emerald-600 text-white border-emerald-600" onClick={() => changeStatus("Terminee")}>
                Valider ✓
              </button>
              <button className="btn danger text-xs" onClick={() => changeStatus("Refusee")}>
                Refuser ✕
              </button>
            </>
          )}
          {canAct && !["Terminee", "Annulee"].includes(task.status) && (
            <button className="btn text-xs" onClick={() => changeStatus("Annulee")}>
              Annuler
            </button>
          )}
          {isAdmin && (
            <button className="btn text-xs" onClick={onEdit}>
              Modifier
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
