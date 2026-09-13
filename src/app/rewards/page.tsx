"use client";

import { useMemo, useState } from "react";
import { AppShell, EmptyState, PageHeader } from "@/components/AppShell";
import { initials } from "@/components/TaskRow";
import { useAuth } from "@/context/AuthContext";
import { createReward, deleteReward, redeemReward, setRedemptionStatus } from "@/lib/firestore-helpers";

const CATEGORY_ICON: Record<string, string> = {
  "Argent de poche": "💶",
  "Temps ecran": "📱",
  Sortie: "🎡",
  Personnalisee: "🎁",
};

export default function RewardsPage() {
  const { familyId, members, rewards, redemptions, activeMemberId } = useAuth();
  const activeMember = members.find((m) => m.id === activeMemberId);
  const isAdmin = activeMember?.role === "admin";
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pending = useMemo(() => redemptions.filter((r) => r.status === "en attente"), [redemptions]);
  const mine = useMemo(() => redemptions.filter((r) => r.memberId === activeMemberId), [redemptions, activeMemberId]);

  if (!familyId || !activeMember) return null;

  const points = activeMember.points || 0;
  const cheapest = rewards.length > 0 ? Math.min(...rewards.map((r) => r.cost)) : 0;

  async function handleRedeem(rewardId: string) {
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward || !activeMember) return;
    setError(null);
    try {
      await redeemReward(familyId!, activeMember, reward);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  const list = isAdmin ? pending : mine;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Boutique"
        title="Les recompenses"
        subtitle="Les points gagnes sur les taches s'echangent ici."
        action={
          isAdmin && (
            <button className="btn primary" onClick={() => setShowNew(true)}>
              <span aria-hidden>＋</span> Recompense
            </button>
          )
        }
      />

      {/* Solde du membre actif */}
      <div
        className="card card-lg mb-5 flex items-center gap-4 animate-in"
        style={{ background: "linear-gradient(135deg, var(--section-soft), var(--surface))" }}
      >
        <span
          className="avatar w-14 h-14 text-base"
          style={{ background: `linear-gradient(135deg, ${activeMember.color || "var(--brand)"}, color-mix(in srgb, ${activeMember.color || "var(--brand)"} 60%, #fff))` }}
        >
          {initials(activeMember.name)}
        </span>
        <div className="flex-1 min-w-0">
          <p className="eyebrow">Solde de {activeMember.name}</p>
          <p className="display leading-none mt-1" style={{ color: "var(--section)" }}>
            {points}
            <span className="text-lg font-extrabold ml-1.5">pts</span>
          </p>
          {activeMember.streak > 0 && <p className="text-xs text-ink-dim mt-1.5">🔥 {activeMember.streak} jours d'affilee</p>}
        </div>
        {rewards.length > 0 && points < cheapest && (
          <div className="text-right hidden sm:block">
            <p className="text-xs text-ink-dim">Prochaine recompense dans</p>
            <p className="title-lg" style={{ color: "var(--section)" }}>
              {cheapest - points} pts
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm p-3 rounded-xl mb-4" style={{ background: "var(--danger-soft)", color: "var(--danger)" }} role="alert">
          <span aria-hidden>✕</span>
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Catalogue */}
      {rewards.length === 0 ? (
        <div className="card card-lg mb-5">
          <EmptyState
            icon="🎁"
            title="Aucune recompense dans le catalogue"
            hint={isAdmin ? "Ajoute-en une pour donner un but aux points gagnes." : "L'administrateur n'en a pas encore ajoute."}
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          {rewards.map((r) => {
            const affordable = points >= r.cost;
            const pct = r.cost > 0 ? Math.min(100, (points / r.cost) * 100) : 100;
            return (
              <div key={r.id} className="card card-lg flex flex-col animate-in" style={affordable ? { borderColor: "var(--section)" } : undefined}>
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-11 h-11 rounded-xl grid place-items-center text-lg shrink-0" style={{ background: "var(--section-soft)" }} aria-hidden>
                    {CATEGORY_ICON[r.category] ?? "🎁"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[0.9375rem] leading-snug">{r.title}</p>
                    <p className="text-[0.6875rem] text-ink-faint font-semibold mt-0.5">{r.category}</p>
                  </div>
                  <span className="badge accent tabular">{r.cost} pts</span>
                </div>

                {!affordable && (
                  <div className="mb-3">
                    <div className="meter">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[0.6875rem] text-ink-faint mt-1.5 font-semibold">Encore {r.cost - points} pts</p>
                  </div>
                )}

                <div className="flex gap-2 mt-auto">
                  <button className="btn primary flex-1" disabled={!affordable} onClick={() => handleRedeem(r.id)}>
                    {affordable ? "Echanger" : "Pas encore"}
                  </button>
                  {isAdmin && (
                    <button className="btn icon ghost" style={{ color: "var(--danger)" }} onClick={() => deleteReward(familyId, r.id)} aria-label={`Supprimer ${r.title}`}>
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Echanges */}
      <div className="card card-lg animate-in">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="title">{isAdmin ? "Echanges a valider" : "Mes echanges"}</h2>
          {list.length > 0 && <span className="badge">{list.length}</span>}
        </div>
        {list.length === 0 ? (
          <EmptyState icon={isAdmin ? "✅" : "🧾"} title={isAdmin ? "Aucune demande en attente" : "Aucun echange pour l'instant"} />
        ) : (
          list.map((r) => {
            const m = members.find((x) => x.id === r.memberId);
            return (
              <div key={r.id} className="row">
                {isAdmin && m && (
                  <span
                    className="avatar w-8 h-8 text-[0.6875rem]"
                    style={{ background: `linear-gradient(135deg, ${m.color || "var(--brand)"}, color-mix(in srgb, ${m.color || "var(--brand)"} 60%, #fff))` }}
                  >
                    {initials(m.name)}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{r.rewardTitle}</p>
                  <p className="text-[0.6875rem] text-ink-faint font-semibold mt-0.5">
                    {isAdmin && m ? `${m.name} · ` : ""}
                    {r.cost} pts
                  </p>
                </div>
                {isAdmin ? (
                  <div className="flex gap-2 shrink-0">
                    <button
                      className="btn sm"
                      style={{ background: "var(--success)", color: "#fff", borderColor: "transparent" }}
                      onClick={() => setRedemptionStatus(familyId, r.id, "valide")}
                    >
                      Valider
                    </button>
                    <button className="btn sm danger" onClick={() => setRedemptionStatus(familyId, r.id, "refuse")}>
                      Refuser
                    </button>
                  </div>
                ) : (
                  <span className={`badge ${r.status === "valide" ? "success" : r.status === "refuse" ? "danger" : "warning"}`}>{r.status}</span>
                )}
              </div>
            );
          })
        )}
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
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: "rgba(20, 14, 8, 0.45)", backdropFilter: "blur(3px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="card card-lg w-full max-w-sm shadow-xl animate-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="title-lg">Nouvelle recompense</h2>
          <button className="btn icon ghost" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <label className="field-label" htmlFor="rw-title">
          Titre
        </label>
        <input id="rw-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="30 min d'ecran" autoFocus />

        <label className="field-label" htmlFor="rw-cost">
          Cout en points
        </label>
        <input id="rw-cost" type="number" min={1} value={cost} onChange={(e) => setCost(Number(e.target.value))} />

        <label className="field-label" htmlFor="rw-cat">
          Categorie
        </label>
        <select id="rw-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
          {["Argent de poche", "Temps ecran", "Sortie", "Personnalisee"].map((c) => (
            <option key={c}>
              {CATEGORY_ICON[c]} {c}
            </option>
          ))}
        </select>

        <div className="flex gap-2 mt-2">
          <button className="btn ghost flex-1" onClick={onClose}>
            Annuler
          </button>
          <button className="btn primary flex-1" onClick={save} disabled={!title.trim()}>
            Creer
          </button>
        </div>
      </div>
    </div>
  );
}
