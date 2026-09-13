"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TaskModal } from "@/components/TaskModal";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { useAuth } from "@/context/AuthContext";
import type { Task, TaskStatus } from "@/types";
import { STATUSES } from "@/types";

export default function TasksPage() {
  const { familyId, family, members, tasks, activeMemberId } = useAuth();
  const activeMember = members.find((m) => m.id === activeMemberId) ?? null;
  const isAdmin = activeMember?.role === "admin";

  const [filterGroup, setFilterGroup] = useState("all");
  const [filterMember, setFilterMember] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | TaskStatus>("all");
  const [editing, setEditing] = useState<Task | null | undefined>(undefined); // undefined = closed, null = new
  const [viewing, setViewing] = useState<Task | null>(null);

  const groups = family?.groups ?? [];

  const list = useMemo(() => {
    let l = tasks.slice();
    if (filterGroup !== "all") l = l.filter((t) => t.group === filterGroup);
    if (filterMember !== "all") l = l.filter((t) => t.assigneeId === filterMember);
    if (filterStatus !== "all") l = l.filter((t) => t.status === filterStatus);
    if (!isAdmin && activeMember) l = l.filter((t) => t.assigneeId === activeMember.id || !t.assigneeId);
    return l;
  }, [tasks, filterGroup, filterMember, filterStatus, isAdmin, activeMember]);

  if (!familyId || !activeMember) return null;

  return (
    <AppShell>
      <div className="flex flex-wrap justify-between gap-2 mb-4">
        <div className="flex flex-wrap gap-2">
          <select className="!w-auto !mb-0" value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}>
            <option value="all">Tous groupes</option>
            {groups.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          <select className="!w-auto !mb-0" value={filterMember} onChange={(e) => setFilterMember(e.target.value)}>
            <option value="all">Tous membres</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select className="!w-auto !mb-0" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "all" | TaskStatus)}>
            <option value="all">Tous statuts</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        {(isAdmin || activeMember.canCreateTasks) && (
          <button className="btn primary" onClick={() => setEditing(null)}>
            + Nouvelle tache
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {list.map((t) => {
          const assignee = members.find((m) => m.id === t.assigneeId);
          return (
            <button key={t.id} onClick={() => setViewing(t)} className="card text-left flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--surface-2)]">{t.status}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--surface-2)]">{t.points} pts</span>
              </div>
              <b>{t.title}</b>
              <span className="text-xs opacity-60">
                {t.group} · {t.type} · ⏱ {t.estimatedMinutes} min
              </span>
              <div className="flex justify-between text-xs opacity-70">
                <span>{assignee ? assignee.name : "Non assignee"}</span>
                <span>{t.dueDate ?? ""}</span>
              </div>
            </button>
          );
        })}
        {list.length === 0 && <p className="opacity-60 text-sm col-span-full">Aucune tache ne correspond aux filtres.</p>}
      </div>

      {editing !== undefined && (
        <TaskModal
          familyId={familyId}
          groups={groups}
          members={members}
          tasks={tasks}
          createdBy={activeMember.id}
          task={editing}
          onClose={() => setEditing(undefined)}
        />
      )}

      {viewing && (
        <TaskDetailModal
          familyId={familyId}
          task={viewing}
          members={members}
          activeMember={activeMember}
          isAdmin={!!isAdmin}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
          }}
        />
      )}
    </AppShell>
  );
}
