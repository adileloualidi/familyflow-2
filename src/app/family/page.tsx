"use client";

import { useState } from "react";
import { AppShell, EmptyState, PageHeader } from "@/components/AppShell";
import { initials } from "@/components/TaskRow";
import { useAuth } from "@/context/AuthContext";
import { createMember, updateMember, deleteMember } from "@/lib/firestore-helpers";
import type { Member, Role } from "@/types";

const ROLE_LABEL: Record<Role, string> = { admin: "Administrateur", adult: "Adulte", child: "Enfant", guest: "Invite" };
const ROLE_ICON: Record<Role, string> = { admin: "👑", adult: "🧑", child: "🧒", guest: "👋" };
const COLORS = ["#d9603b", "#2e8b6a", "#3d6fb5", "#9c5aa8", "#c98a1a", "#3aa1a8", "#c44536", "#5c7a3a"];

export default function FamilyPage() {
  const { familyId, family, members, tasks, activeMemberId } = useAuth();
  const activeMember = members.find((m) => m.id === activeMemberId);
  const [editing, setEditing] = useState<Member | null | undefined>(undefined);

  if (!familyId) return null;

  if (activeMember?.role !== "admin") {
    return (
      <AppShell>
        <PageHeader eyebrow="Acces restreint" title="La famille" />
        <div className="card card-lg">
          <EmptyState icon="🔒" title="Page reservee a l'administrateur" hint="Demande a l'administrateur de la famille de gerer les membres." />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={family?.name ?? "Famille"}
        title="Les membres"
        subtitle={`${members.filter((m) => m.status === "active").length} membre(s) actif(s). Chacun a sa couleur, son role et ses points.`}
        action={
          <button className="btn primary" onClick={() => setEditing(null)}>
            <span aria-hidden>＋</span> Membre
          </button>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => {
          const openTasks = tasks.filter((t) => t.assigneeId === m.id && !["Terminee", "Annulee", "Refusee"].includes(t.status)).length;
          const suspended = m.status === "suspended";
          return (
            <div key={m.id} className="card card-lg flex flex-col animate-in" style={suspended ? { opacity: 0.6 } : undefined}>
              <div className="flex items-start gap-3 mb-4">
                <span
                  className="avatar w-12 h-12 text-sm"
                  style={{ background: `linear-gradient(135deg, ${m.color || "var(--brand)"}, color-mix(in srgb, ${m.color || "var(--brand)"} 60%, #fff))` }}
                >
                  {initials(m.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-bold text-[0.9375rem] truncate">{m.name}</p>
                    {suspended && <span className="badge">suspendu</span>}
                  </div>
                  <p className="text-[0.6875rem] text-ink-faint font-semibold mt-0.5">
                    {ROLE_ICON[m.role]} {ROLE_LABEL[m.role]}
                    {m.age ? ` · ${m.age} ans` : ""}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <MiniFact value={m.points} label="points" />
                <MiniFact value={m.tasksDone || 0} label="faites" />
                <MiniFact value={openTasks} label="en cours" />
              </div>

              {m.badges.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-3">
                  {m.badges.slice(0, 5).map((b) => (
                    <span key={b} className="badge accent">
                      {b}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-auto">
                <button className="btn sm flex-1" onClick={() => setEditing(m)}>
                  Modifier
                </button>
                <button
                  className="btn sm"
                  onClick={() => updateMember(familyId, m.id, { status: suspended ? "active" : "suspended" })}
                >
                  {suspended ? "Reactiver" : "Suspendre"}
                </button>
                <button
                  className="btn icon ghost"
                  style={{ color: "var(--danger)" }}
                  aria-label={`Supprimer ${m.name}`}
                  onClick={() => {
                    if (confirm(`Supprimer ${m.name} ? Cette action est irreversible.`)) deleteMember(familyId, m.id);
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editing !== undefined && <MemberModal familyId={familyId} member={editing} onClose={() => setEditing(undefined)} />}
    </AppShell>
  );
}

function MiniFact({ value, label }: { value: number; label: string }) {
  return (
    <div className="py-2 rounded-xl" style={{ background: "var(--surface-2)" }}>
      <div className="text-base font-extrabold tabular leading-none">{value}</div>
      <div className="text-[0.625rem] font-bold text-ink-faint mt-1">{label}</div>
    </div>
  );
}

function MemberModal({ familyId, member, onClose }: { familyId: string; member?: Member | null; onClose: () => void }) {
  const [name, setName] = useState(member?.name ?? "");
  const [role, setRole] = useState<Role>(member?.role ?? "child");
  const [age, setAge] = useState(member?.age != null ? String(member.age) : "");
  const [color, setColor] = useState(member?.color ?? COLORS[0]!);
  const [skills, setSkills] = useState((member?.skills ?? []).join(", "));
  const [preferences, setPreferences] = useState((member?.preferences ?? []).join(", "));
  const [availability, setAvailability] = useState((member?.availability ?? []).join(", "));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim()) {
      setError("Le nom est requis.");
      return;
    }
    setBusy(true);
    try {
      const data = {
        name: name.trim(),
        role,
        age: age ? Number(age) : null,
        color,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        preferences: preferences.split(",").map((s) => s.trim()).filter(Boolean),
        availability: availability.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
      };
      if (member) await updateMember(familyId, member.id, data);
      else await createMember(familyId, data);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: "rgba(20, 14, 8, 0.45)", backdropFilter: "blur(3px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="card card-lg w-full max-w-md max-h-[88vh] overflow-auto shadow-xl animate-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="title-lg">{member ? "Modifier le membre" : "Nouveau membre"}</h2>
          <button className="btn icon ghost" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="avatar w-14 h-14 text-base" style={{ background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 60%, #fff))` }}>
            {name.trim() ? initials(name) : "?"}
          </span>
          <div className="flex-1">
            <label className="field-label" htmlFor="mb-name">
              Nom
            </label>
            <input id="mb-name" type="text" className="!mb-0" value={name} onChange={(e) => setName(e.target.value)} placeholder="Prenom" autoFocus />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="mb-role">
              Role
            </label>
            <select id="mb-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_ICON[r]} {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="mb-age">
              Age
            </label>
            <input id="mb-age" type="number" min={0} max={120} value={age} onChange={(e) => setAge(e.target.value)} placeholder="—" />
          </div>
        </div>

        <label className="field-label">Couleur</label>
        <div className="flex gap-2 flex-wrap mb-4">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="w-8 h-8 rounded-full transition-transform"
              style={{
                background: c,
                outline: c === color ? "2px solid var(--text)" : "none",
                outlineOffset: "2px",
                transform: c === color ? "scale(1.1)" : undefined,
              }}
              onClick={() => setColor(c)}
              aria-label={`Couleur ${c}`}
              aria-pressed={c === color}
            />
          ))}
        </div>

        <label className="field-label" htmlFor="mb-skills">
          Competences — groupes de taches, separes par des virgules
        </label>
        <input id="mb-skills" type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Cuisine, Jardin" />

        <label className="field-label" htmlFor="mb-pref">
          Preferences
        </label>
        <input id="mb-pref" type="text" value={preferences} onChange={(e) => setPreferences(e.target.value)} placeholder="Animaux" />

        <label className="field-label" htmlFor="mb-avail">
          Disponibilites — jours de la semaine
        </label>
        <input id="mb-avail" type="text" value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="lundi, mercredi" />

        {error && (
          <div className="flex items-center gap-2 text-sm p-3 rounded-xl mb-3" style={{ background: "var(--danger-soft)", color: "var(--danger)" }} role="alert">
            <span aria-hidden>✕</span>
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <button className="btn ghost flex-1" onClick={onClose}>
            Annuler
          </button>
          <button className="btn primary flex-1" onClick={save} disabled={busy || !name.trim()}>
            {busy ? "…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
