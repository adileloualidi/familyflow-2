"use client";

import { useMemo, useState } from "react";
import { AppShell, EmptyState, PageHeader } from "@/components/AppShell";
import { TaskModal } from "@/components/TaskModal";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { TaskRow } from "@/components/TaskRow";
import { VoiceButton } from "@/components/VoiceInput";
import { useAuth } from "@/context/AuthContext";
import { createTask } from "@/lib/firestore-helpers";
import { BUCKET_LABELS, BUCKET_ORDER, bucketOf, todayISO, type DueBucket } from "@/lib/dates";
import type { Task } from "@/types";

type Scope = "actives" | "mes-taches" | "a-valider" | "terminees";

const SCOPES: { id: Scope; label: string }[] = [
  { id: "actives", label: "A faire" },
  { id: "mes-taches", label: "Mes taches" },
  { id: "a-valider", label: "A valider" },
  { id: "terminees", label: "Terminees" },
];

const CLOSED = ["Terminee", "Annulee", "Refusee"];

export default function TasksPage() {
  const { familyId, family, members, tasks, activeMemberId } = useAuth();
  const activeMember = members.find((m) => m.id === activeMemberId) ?? null;
  const isAdmin = activeMember?.role === "admin";

  const [scope, setScope] = useState<Scope>("actives");
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterMember, setFilterMember] = useState("all");
  const [search, setSearch] = useState("");
  const [quick, setQuick] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Task | null | undefined>(undefined); // undefined = ferme, null = nouvelle
  const [viewing, setViewing] = useState<Task | null>(null);

  const groups = family?.groups ?? [];
  const canCreate = !!(isAdmin || activeMember?.canCreateTasks);

  const list = useMemo(() => {
    let l = tasks.slice();

    // Un membre non-admin ne voit que ses taches et celles qui ne sont assignees a personne.
    if (!isAdmin && activeMember) l = l.filter((t) => t.assigneeId === activeMember.id || !t.assigneeId);

    if (scope === "actives") l = l.filter((t) => !CLOSED.includes(t.status));
    else if (scope === "mes-taches") l = l.filter((t) => t.assigneeId === activeMember?.id && !CLOSED.includes(t.status));
    else if (scope === "a-valider") l = l.filter((t) => t.status === "A valider");
    else l = l.filter((t) => t.status === "Terminee");

    if (filterGroup !== "all") l = l.filter((t) => t.group === filterGroup);
    if (filterMember !== "all") l = l.filter((t) => t.assigneeId === filterMember);

    const q = search.trim().toLowerCase();
    if (q) l = l.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));

    return l;
  }, [tasks, scope, filterGroup, filterMember, search, isAdmin, activeMember]);

  // Regroupement par echeance, facon Things : ce qui presse remonte en haut.
  const grouped = useMemo(() => {
    const map = new Map<DueBucket, Task[]>();
    for (const t of list) {
      const b = scope === "terminees" ? "sans-date" : bucketOf(t.dueDate);
      const arr = map.get(b);
      if (arr) arr.push(t);
      else map.set(b, [t]);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => (b.points || 0) - (a.points || 0));
    }
    return BUCKET_ORDER.filter((b) => map.has(b)).map((b) => ({ bucket: b, tasks: map.get(b)! }));
  }, [list, scope]);

  const counts = useMemo(() => {
    const open = tasks.filter((t) => !CLOSED.includes(t.status));
    return {
      late: open.filter((t) => t.dueDate && t.dueDate < todayISO()).length,
      today: open.filter((t) => t.dueDate === todayISO()).length,
      pending: tasks.filter((t) => t.status === "A valider").length,
    };
  }, [tasks]);

  if (!familyId || !activeMember) return null;

  // Ajout rapide : un titre suffit, le reste prend des valeurs par defaut sensees.
  async function quickAdd(title: string) {
    const clean = title.trim();
    if (!clean || adding) return;
    setAdding(true);
    try {
      await createTask(
        familyId!,
        {
          title: clean,
          group: filterGroup !== "all" ? filterGroup : (groups[0] ?? "Personnalise"),
          assigneeId: filterMember !== "all" ? filterMember : (scope === "mes-taches" ? activeMember!.id : null),
          dueDate: todayISO(),
        },
        activeMember!.id
      );
      setQuick("");
    } finally {
      setAdding(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Organisation"
        title="Les taches"
        subtitle={
          counts.late > 0
            ? `${counts.late} tache${counts.late > 1 ? "s" : ""} en retard, ${counts.today} prevue${counts.today > 1 ? "s" : ""} aujourd'hui.`
            : counts.today > 0
              ? `${counts.today} tache${counts.today > 1 ? "s" : ""} prevue${counts.today > 1 ? "s" : ""} aujourd'hui.`
              : "Rien d'urgent au programme."
        }
        action={
          canCreate && (
            <button className="btn primary" onClick={() => setEditing(null)}>
              <span aria-hidden>＋</span> Tache detaillee
            </button>
          )
        }
      />

      {canCreate && (
        <div className="quick-add mb-4 animate-in">
          <span className="text-ink-faint text-lg" aria-hidden>
            ＋
          </span>
          <input
            type="text"
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && quickAdd(quick)}
            placeholder="Ajouter une tache et appuyer sur Entree…"
            aria-label="Ajout rapide d'une tache"
            disabled={adding}
          />
          <VoiceButton onResult={(t) => quickAdd(t)} label="" className="icon ghost shrink-0" />
          {quick.trim() && (
            <button className="btn primary sm shrink-0" onClick={() => quickAdd(quick)} disabled={adding}>
              {adding ? "…" : "Ajouter"}
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="segmented scroll-x max-w-full">
          {SCOPES.map((s) => (
            <button key={s.id} data-active={scope === s.id} onClick={() => setScope(s.id)}>
              {s.label}
              {s.id === "a-valider" && counts.pending > 0 && <span className="ml-1.5 text-[0.625rem]">· {counts.pending}</span>}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <input
            type="search"
            className="!mb-0 !w-auto min-w-[9rem]"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="!w-auto !mb-0" value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} aria-label="Filtrer par groupe">
            <option value="all">Tous les groupes</option>
            {groups.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          {isAdmin && (
            <select className="!w-auto !mb-0" value={filterMember} onChange={(e) => setFilterMember(e.target.value)} aria-label="Filtrer par membre">
              <option value="all">Tout le monde</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="card card-lg animate-in">
        {grouped.length === 0 ? (
          <EmptyState
            icon={scope === "terminees" ? "🏁" : search ? "🔍" : "🎉"}
            title={
              search
                ? "Aucun resultat"
                : scope === "terminees"
                  ? "Aucune tache terminee pour l'instant"
                  : scope === "a-valider"
                    ? "Rien a valider"
                    : "Tout est fait !"
            }
            hint={!search && scope === "actives" && canCreate ? "Ajoute une tache avec le champ ci-dessus." : undefined}
          />
        ) : (
          grouped.map(({ bucket, tasks: bucketTasks }) => (
            <section key={bucket}>
              {scope !== "terminees" && (
                <div className="group-head" style={bucket === "retard" ? { color: "var(--danger)" } : undefined}>
                  <span aria-hidden>{BUCKET_LABELS[bucket].icon}</span>
                  {BUCKET_LABELS[bucket].label}
                  <span className="count tabular">{bucketTasks.length}</span>
                </div>
              )}
              {bucketTasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  members={members}
                  activeMember={activeMember}
                  isAdmin={!!isAdmin}
                  familyId={familyId}
                  onOpen={() => setViewing(t)}
                />
              ))}
            </section>
          ))
        )}
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
          task={tasks.find((t) => t.id === viewing.id) ?? viewing}
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
