"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { createReward, deleteReward, redeemReward, setRedemptionStatus } from "@/lib/firestore-helpers";

export default function RewardsPage() {
  const { familyId, members, rewards, redemptions, activeMemberId } = useAuth();
  const activeMember = members.find((m) => m.id === activeMemberId);
  const isAdmin = activeMember?.role === "admin";
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!familyId || !activeMember) return null;

  const pending = redemptions.filter((r) => r.status === "en attente");
  const mine = redemptions.filter((r) => r.memberId === activeMember.id);

  async function handleRedeem(rewardId: string) {
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward || !activeMember) return;
    try {
      await redeemReward(familyId!, activeMember, reward);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <AppShell>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-extrabold">Catalogue de recompenses</h2>
        {isAdmin && (
          <button className="btn primary" onClick={() => setShowNew(true)}>
            + Recompense
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      <div className="grid md:grid-cols-3 gap-3">
        {rewards.map((r) => (
          <div key={r.id} className="card">
            <div className="flex justify-between">
              <b>{r.title}</b>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--surface-2)]">{r.cost} pts</span>
            </div>
            <div className="text-xs opacity-60 mb-3">{r.category}</div>
            <div className="flex justify-between">
              <button className="btn primary text-xs" disabled={activeMember.points < r.cost} onClick={() => handleRedeem(r.id)}>
                Echanger
              </button>
              {isAdmin && (
                <button className="btn danger text-xs" onClick={() => deleteReward(familyId, r.id)}>
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
        {rewards.length === 0 && <p className="opacity-60 text-sm col-span-full">Aucune recompense pour le moment.</p>}
      </div>

      <div className="card mt-4">
        <h3 className="font-bold mb-2">{isAdmin ? "Echanges en attente" : "Mon historique"}</h3>
        {(isAdmin ? pending : mine).map((r) => {
          const m = members.find((x) => x.id === r.memberId);
          return (
            <div key={r.id} className="flex justify-between items-center py-2 border-b border-[var(--border)] text-sm">
              <span>
                {isAdmin ? `${m?.name ?? "?"} → ` : ""}
                {r.rewardTitle} ({r.cost} pts)
              </span>
              {isAdmin ? (
                <div className="flex gap-2">
                  <button className="btn text-xs bg-emerald-600 text-white border-emerald-600" onClick={() => setRedemptionStatus(familyId, r.id, "valide")}>
                    Valider
                  </button>
                  <button className="btn danger text-xs" onClick={() => setRedemptionStatus(familyId, r.id, "refuse")}>
                    Refuser
                  </button>
                </div>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-2)]">{r.status}</span>
              )}
            </div>
          );
        })}
        {(isAdmin ? pending : mine).length === 0 && <p className="text-sm opacity-60">Rien pour le moment</p>}
      </div>

      {showNew && <NewRewardModal familyId={familyId} onClose={() => setShowNew(false)} />}
    </AppShell>
  );
}

function NewRewardModal({ familyId, onClose }: { familyId: string; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [cost, setCost] = useState(20);
  const [category, setCategory] = useState("Personnalisee");

  async function save() {
    if (!title.trim()) return;
    await createReward(familyId, { title: title.trim(), cost, category });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card w-full max-w-sm">
        <div className="flex justify-between mb-2">
          <h3 className="font-bold text-lg">Nouvelle recompense</h3>
          <button onClick={onClose} className="opacity-60">
            ✕
          </button>
        </div>
        <label className="text-xs font-bold opacity-70">Titre</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="30 min d'ecran" />
        <label className="text-xs font-bold opacity-70">Cout (points)</label>
        <input type="number" min={1} value={cost} onChange={(e) => setCost(Number(e.target.value))} />
        <label className="text-xs font-bold opacity-70">Categorie</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {["Argent de poche", "Temps ecran", "Sortie", "Personnalisee"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button className="btn primary mt-2" onClick={save}>
          Creer
        </button>
      </div>
    </div>
  );
}
