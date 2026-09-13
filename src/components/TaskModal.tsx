"use client";

import { useState } from "react";
import type { Member, Task, TaskType } from "@/types";
import { computeAutoAssignScores } from "@/lib/family";
import { createTask, updateTask, deleteTask } from "@/lib/firestore-helpers";
import { VoiceButton } from "@/components/VoiceInput";
import { initials } from "@/components/TaskRow";

interface Props {
  familyId: string;
  groups: string[];
  members: Member[];
  tasks: Task[];
  createdBy: string | null;
  task?: Task | null;
  onClose: () => void;
}

const TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: "simple", label: "Simple" },
  { value: "recurrente", label: "Recurrente" },
  { value: "programmee", label: "Programmee" },
  { value: "conditionnelle", label: "Conditionnelle" },
  { value: "urgente", label: "Urgente" },
];

const DIFFICULTIES: { value: Task["difficulty"]; label: string; color: string }[] = [
  { value: "facile", label: "Facile", color: "var(--success)" },
  { value: "moyen", label: "Moyen", color: "var(--warning)" },
  { value: "difficile", label: "Difficile", color: "var(--danger)" },
];

export function TaskModal({ familyId, groups, members, tasks, createdBy, task, onClose }: Props) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [group, setGroup] = useState(task?.group ?? groups[0] ?? "Personnalise");
  const [type, setType] = useState<TaskType>(task?.type ?? "simple");
  const [points, setPoints] = useState(task?.points ?? 5);
  const [difficulty, setDifficulty] = useState<Task["difficulty"]>(task?.difficulty ?? "facile");
  const [estimatedMinutes, setEstimatedMinutes] = useState(task?.estimatedMinutes ?? 10);
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [minAge, setMinAge] = useState(task?.minAge != null ? String(task.minAge) : "");
  const [mode, setMode] = useState<"manuel" | "auto">("manuel");
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? "");
  const [autoResult, setAutoResult] = useState<ReturnType<typeof computeAutoAssignScores> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignable = members.filter((m) => m.status === "active" && m.role !== "guest");

  function runAuto() {
    setAutoResult(computeAutoAssignScores({ group, minAge: minAge ? Number(minAge) : null, points }, members, tasks));
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Le titre est requis.");
      return;
    }
    let finalAssignee: string | null = assigneeId || null;
    if (mode === "auto") {
      const best = autoResult?.find((s) => s.score > -9999);
      if (!best) {
        setError("Calcule d'abord l'attribution automatique.");
        return;
      }
      finalAssignee = best.member.id;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        description,
        group,
        type,
        points: Number(points) || 5,
        difficulty,
        estimatedMinutes: Number(estimatedMinutes) || 10,
        dueDate: dueDate || null,
        minAge: minAge ? Number(minAge) : null,
        assigneeId: finalAssignee,
        assignedMode: mode,
      } as const;
      if (task) await updateTask(familyId, task.id, payload);
      else await createTask(familyId, payload, createdBy);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!confirm("Supprimer cette tache ?")) return;
    await deleteTask(familyId, task.id);
    onClose();
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
        <div className="flex justify-between items-center mb-5">
          <h2 className="title-lg">{task ? "Modifier la tache" : "Nouvelle tache"}</h2>
          <button className="btn icon ghost" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <label className="field-label" htmlFor="tk-title">
          Titre
        </label>
        <div className="flex gap-2">
          <input id="tk-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Sortir les poubelles" autoFocus />
          <VoiceButton onResult={setTitle} label="" className="icon shrink-0 !mb-3" />
        </div>

        <label className="field-label" htmlFor="tk-desc">
          Description
        </label>
        <textarea id="tk-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Details, consignes…" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="tk-group">
              Groupe
            </label>
            <select id="tk-group" value={group} onChange={(e) => setGroup(e.target.value)}>
              {groups.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="tk-type">
              Type
            </label>
            <select id="tk-type" value={type} onChange={(e) => setType(e.target.value as TaskType)}>
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="field-label">Difficulte</label>
        <div className="segmented mb-4 w-full">
          {DIFFICULTIES.map((d) => (
            <button key={d.value} type="button" className="flex-1" data-active={difficulty === d.value} onClick={() => setDifficulty(d.value)}>
              <span className="dot mr-1.5" style={{ background: d.color }} />
              {d.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="tk-points">
              Points
            </label>
            <input id="tk-points" type="number" min={1} value={points} onChange={(e) => setPoints(Number(e.target.value))} />
          </div>
          <div>
            <label className="field-label" htmlFor="tk-min">
              Temps estime (min)
            </label>
            <input id="tk-min" type="number" min={1} value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(Number(e.target.value))} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="tk-due">
              Echeance
            </label>
            <input id="tk-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="tk-age">
              Age minimum
            </label>
            <input id="tk-age" type="number" min={0} value={minAge} onChange={(e) => setMinAge(e.target.value)} placeholder="Aucun" />
          </div>
        </div>

        <label className="field-label">Attribution</label>
        <div className="segmented mb-3 w-full">
          <button type="button" className="flex-1" data-active={mode === "manuel"} onClick={() => setMode("manuel")}>
            Manuelle
          </button>
          <button type="button" className="flex-1" data-active={mode === "auto"} onClick={() => setMode("auto")}>
            ✨ Automatique
          </button>
        </div>

        {mode === "manuel" ? (
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              type="button"
              className="btn sm"
              data-active={!assigneeId}
              style={!assigneeId ? { borderColor: "var(--section)", color: "var(--section)" } : undefined}
              onClick={() => setAssigneeId("")}
            >
              Non assignee
            </button>
            {assignable.map((m) => {
              const picked = assigneeId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  className="btn sm"
                  style={picked ? { borderColor: m.color, boxShadow: `0 0 0 2px color-mix(in srgb, ${m.color} 22%, transparent)` } : undefined}
                  onClick={() => setAssigneeId(m.id)}
                >
                  <span
                    className="avatar w-5 h-5 text-[0.5rem]"
                    style={{ background: `linear-gradient(135deg, ${m.color}, color-mix(in srgb, ${m.color} 60%, #fff))` }}
                  >
                    {initials(m.name)}
                  </span>
                  {m.name}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mb-4">
            <button type="button" className="btn" onClick={runAuto}>
              <span aria-hidden>✨</span> Calculer la meilleure attribution
            </button>
            {autoResult && (
              <div className="mt-3 flex flex-col gap-1.5">
                {autoResult.slice(0, 5).map((s, i) => (
                  <div
                    key={s.member.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl text-xs"
                    style={{ background: i === 0 ? "var(--section-soft)" : "var(--surface-2)" }}
                  >
                    <span
                      className="avatar w-6 h-6 text-[0.5625rem]"
                      style={{ background: `linear-gradient(135deg, ${s.member.color}, color-mix(in srgb, ${s.member.color} 60%, #fff))` }}
                    >
                      {initials(s.member.name)}
                    </span>
                    <span className={i === 0 ? "font-extrabold" : "font-semibold"}>{s.member.name}</span>
                    <span className="text-ink-faint flex-1 truncate">{s.reasons.join(", ")}</span>
                    <span className="badge tabular">{s.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm p-3 rounded-xl mb-3" style={{ background: "var(--danger-soft)", color: "var(--danger)" }} role="alert">
            <span aria-hidden>✕</span>
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          {task && (
            <button className="btn" style={{ color: "var(--danger)" }} onClick={handleDelete}>
              Supprimer
            </button>
          )}
          <button className="btn ghost flex-1" onClick={onClose}>
            Annuler
          </button>
          <button className="btn primary flex-1" onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? "…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
