"use client";

import { useState } from "react";
import type { Member, Task, TaskType } from "@/types";
import { computeAutoAssignScores } from "@/lib/family";
import { createTask, updateTask, deleteTask } from "@/lib/firestore-helpers";

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

export function TaskModal({ familyId, groups, members, tasks, createdBy, task, onClose }: Props) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [group, setGroup] = useState(task?.group ?? groups[0] ?? "Personnalise");
  const [type, setType] = useState<TaskType>(task?.type ?? "simple");
  const [points, setPoints] = useState(task?.points ?? 5);
  const [difficulty, setDifficulty] = useState(task?.difficulty ?? "facile");
  const [estimatedMinutes, setEstimatedMinutes] = useState(task?.estimatedMinutes ?? 10);
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [minAge, setMinAge] = useState(task?.minAge != null ? String(task.minAge) : "");
  const [mode, setMode] = useState<"manuel" | "auto">("manuel");
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? "");
  const [autoResult, setAutoResult] = useState<ReturnType<typeof computeAutoAssignScores> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function runAuto() {
    const scores = computeAutoAssignScores(
      { group, minAge: minAge ? Number(minAge) : null, points },
      members,
      tasks
    );
    setAutoResult(scores);
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card w-full max-w-lg max-h-[88vh] overflow-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg">{task ? "Modifier la tache" : "Nouvelle tache"}</h3>
          <button className="opacity-60 text-lg" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <label className="text-xs font-bold opacity-70">Titre</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />

        <label className="text-xs font-bold opacity-70">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold opacity-70">Groupe</label>
            <select value={group} onChange={(e) => setGroup(e.target.value)}>
              {groups.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold opacity-70">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as TaskType)}>
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold opacity-70">Points</label>
            <input type="number" min={1} value={points} onChange={(e) => setPoints(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs font-bold opacity-70">Difficulte</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Task["difficulty"])}>
              <option value="facile">facile</option>
              <option value="moyen">moyen</option>
              <option value="difficile">difficile</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold opacity-70">Temps (min)</label>
            <input type="number" min={1} value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(Number(e.target.value))} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold opacity-70">Echeance</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold opacity-70">Age minimum (optionnel)</label>
            <input type="number" min={0} value={minAge} onChange={(e) => setMinAge(e.target.value)} />
          </div>
        </div>

        <label className="text-xs font-bold opacity-70">Mode d&apos;attribution</label>
        <div className="flex gap-4 mb-2 text-sm">
          <label className="flex items-center gap-1">
            <input type="radio" checked={mode === "manuel"} onChange={() => setMode("manuel")} /> Manuel
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" checked={mode === "auto"} onChange={() => setMode("auto")} /> Automatique (IA)
          </label>
        </div>

        {mode === "manuel" ? (
          <div>
            <label className="text-xs font-bold opacity-70">Membre assigne</label>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">— Non assigne —</option>
              {members
                .filter((m) => m.status === "active" && m.role !== "guest")
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </div>
        ) : (
          <div className="mb-3">
            <button type="button" className="btn text-xs" onClick={runAuto}>
              Calculer la meilleure attribution
            </button>
            {autoResult && (
              <div className="text-xs opacity-70 mt-2 space-y-1">
                {autoResult.slice(0, 5).map((s, i) => (
                  <div key={s.member.id}>
                    {i === 0 ? <b>→ {s.member.name}</b> : s.member.name} (score {s.score}) — {s.reasons.join(", ")}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

        <div className="flex gap-2 mt-2">
          <button className="btn primary" onClick={handleSave} disabled={saving}>
            {saving ? "…" : "Enregistrer"}
          </button>
          <button className="btn" onClick={onClose}>
            Annuler
          </button>
          {task && (
            <button className="btn danger" onClick={handleDelete}>
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
