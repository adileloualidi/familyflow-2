"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { createMember, updateMember, deleteMember } from "@/lib/firestore-helpers";
import type { Member, Role } from "@/types";

const ROLE_LABEL: Record<Role, string> = { admin: "Administrateur", adult: "Adulte", child: "Enfant", guest: "Invite" };
const COLORS = ["#e0703a", "#3a8f7a", "#3a6fbf", "#a13aab", "#c98a1f", "#3aa1a8", "#c14545", "#5c7a3a"];

export default function FamilyPage() {
  const { familyId, members, activeMemberId } = useAuth();
  const activeMember = members.find((m) => m.id === activeMemberId);
  const [editing, setEditing] = useState<Member | null | undefined>(undefined);

  if (!familyId) return null;

  if (activeMember?.role !== "admin") {
    return (
      <AppShell>
        <div className="card">Cette page est reservee a l&apos;administrateur de la famille.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-extrabold">Gestion de la famille</h2>
        <button className="btn primary" onClick={() => setEditing(null)}>
          + Ajouter un membre
        </button>
      </div>

      <div className="card divide-y divide-[var(--border)]">
        {members.map((m) => (
          <div key={m.id} className="flex justify-between items-center py-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: m.color }}
              >
                {m.name[0]?.toUpperCase()}
              </div>
              <div>
                <b>{m.name}</b> {m.status === "suspended" && <span className="text-xs opacity-60">(suspendu)</span>}
                <div className="text-xs opacity-60">
                  {ROLE_LABEL[m.role]}
                  {m.age ? ` · ${m.age} ans` : ""} · {m.points} pts
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn text-xs" onClick={() => setEditing(m)}>
                Modifier
              </button>
              <button
                className="btn text-xs"
                onClick={() => updateMember(familyId, m.id, { status: m.status === "suspended" ? "active" : "suspended" })}
              >
                {m.status === "suspended" ? "Reactiver" : "Suspendre"}
              </button>
              <button
                className="btn danger text-xs"
                onClick={() => {
                  if (confirm("Supprimer ce membre ? Action irreversible.")) deleteMember(familyId, m.id);
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing !== undefined && <MemberModal familyId={familyId} member={editing} onClose={() => setEditing(undefined)} />}
    </AppShell>
  );
}

function MemberModal({ familyId, member, onClose }: { familyId: string; member?: Member | null; onClose: () => void }) {
  const [name, setName] = useState(member?.name ?? "");
  const [role, setRole] = useState<Role>(member?.role ?? "child");
  const [age, setAge] = useState(member?.age != null ? String(member.age) : "");
  const [color, setColor] = useState(member?.color ?? COLORS[0]);
  const [skills, setSkills] = useState((member?.skills ?? []).join(", "));
  const [preferences, setPreferences] = useState((member?.preferences ?? []).join(", "));
  const [availability, setAvailability] = useState((member?.availability ?? []).join(", "));
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) {
      setError("Le nom est requis.");
      return;
    }
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
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card w-full max-w-md">
        <div className="flex justify-between mb-2">
          <h3 className="font-bold text-lg">{member ? "Modifier le membre" : "Nouveau membre"}</h3>
          <button onClick={onClose} className="opacity-60">
            ✕
          </button>
        </div>
        <label className="text-xs font-bold opacity-70">Nom</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="text-xs font-bold opacity-70">Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
        <label className="text-xs font-bold opacity-70">Age</label>
        <input type="number" min={0} max={120} value={age} onChange={(e) => setAge(e.target.value)} />
        <label className="text-xs font-bold opacity-70">Couleur</label>
        <div className="flex gap-2 mb-3">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="w-6 h-6 rounded-full"
              style={{ background: c, border: c === color ? "2px solid var(--text)" : "2px solid transparent" }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <label className="text-xs font-bold opacity-70">Competences (groupes, separes par virgule)</label>
        <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Cuisine, Jardin" />
        <label className="text-xs font-bold opacity-70">Preferences</label>
        <input type="text" value={preferences} onChange={(e) => setPreferences(e.target.value)} placeholder="Animaux" />
        <label className="text-xs font-bold opacity-70">Disponibilites (jours)</label>
        <input type="text" value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="lundi, mercredi" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 mt-2">
          <button className="btn primary" onClick={save}>
            Enregistrer
          </button>
          <button className="btn" onClick={onClose}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
