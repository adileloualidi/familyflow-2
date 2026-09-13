"use client";

import { useMemo, useState } from "react";
import { AppShell, EmptyState, PageHeader } from "@/components/AppShell";
import { VoiceButton } from "@/components/VoiceInput";
import { useAuth } from "@/context/AuthContext";
import { addShoppingItem, deleteShoppingItem, setShoppingCategory, toggleShoppingItem } from "@/lib/firestore-helpers";
import { CATEGORIES, categoryOf, guessCategory } from "@/lib/categories";
import type { CategoryId, ShoppingItem } from "@/types";

export default function ShoppingPage() {
  const { familyId, shopping, activeMemberId } = useAuth();
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [category, setCategory] = useState<CategoryId>("autre");
  const [userSetCategory, setUserSetCategory] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const todo = useMemo(() => shopping.filter((s) => !s.done), [shopping]);
  const done = useMemo(() => shopping.filter((s) => s.done), [shopping]);
  const groups = useMemo(
    () =>
      CATEGORIES.map((c) => ({ cat: c, items: todo.filter((s) => s.category === c.id) })).filter((g) => g.items.length > 0),
    [todo]
  );
  const progress = shopping.length > 0 ? Math.round((done.length / shopping.length) * 100) : 0;

  if (!familyId) return null;

  async function handleAdd(rawName?: string) {
    const value = (rawName ?? name).trim();
    if (!value) return;
    await addShoppingItem(familyId!, {
      name: value,
      qty: qty.trim(),
      // Si l'article vient de la dictee, le rayon est devine a la volee.
      category: rawName ? guessCategory(value) : category,
      addedBy: activeMemberId ?? null,
    });
    setName("");
    setQty("");
    setCategory("autre");
    setUserSetCategory(false);
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Liste de courses"
        title="Les courses"
        subtitle="Organisee par rayon pour ne pas faire d'aller-retour dans le magasin. Les repas planifies et le stock bas l'alimentent tout seuls."
      />

      {shopping.length > 0 && (
        <div className="card mb-4 flex items-center gap-4 animate-in">
          <div className="flex-1">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-sm font-bold">
                {done.length} sur {shopping.length} dans le caddie
              </span>
              <span className="text-sm font-extrabold tabular" style={{ color: "var(--section)" }}>
                {progress}%
              </span>
            </div>
            <div className="meter">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ---- Ajout ---- */}
      <div className="card card-lg mb-5 animate-in">
        <h2 className="title mb-3">Ajouter un article</h2>
        <div className="grid md:grid-cols-[1fr_130px_200px_auto_auto] gap-2 items-end">
          <div>
            <label className="field-label" htmlFor="shop-name">
              Article
            </label>
            <input
              id="shop-name"
              type="text"
              className="!mb-0"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!userSetCategory) setCategory(guessCategory(e.target.value));
              }}
              placeholder="Ex : Tomates"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="shop-qty">
              Quantite
            </label>
            <input
              id="shop-qty"
              type="text"
              className="!mb-0"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="1 kg"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="shop-cat">
              Rayon
            </label>
            <select
              id="shop-cat"
              className="!mb-0"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as CategoryId);
                setUserSetCategory(true);
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </div>
          <VoiceButton onResult={(t) => handleAdd(t)} label="" className="icon" />
          <button className="btn primary" onClick={() => handleAdd()} disabled={!name.trim()}>
            Ajouter
          </button>
        </div>
      </div>

      {/* ---- Liste par rayon ---- */}
      {groups.length === 0 && done.length === 0 ? (
        <div className="card card-lg">
          <EmptyState icon="🛒" title="La liste est vide" hint="Ajoute un article, ou planifie un repas pour remplir la liste automatiquement." />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {groups.map((g) => (
            <div key={g.cat.id} className="card card-lg animate-in">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-9 h-9 rounded-xl grid place-items-center text-base" style={{ background: "var(--section-soft)" }} aria-hidden>
                  {g.cat.icon}
                </span>
                <h2 className="title flex-1">{g.cat.label}</h2>
                <span className="badge">{g.items.length}</span>
              </div>
              {g.items.map((item) => (
                <ShoppingRow key={item.id} familyId={familyId} item={item} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ---- Caddie ---- */}
      {done.length > 0 && (
        <div className="card card-lg mt-4 animate-in">
          <button className="flex items-center gap-2.5 w-full text-left" onClick={() => setShowDone((v) => !v)}>
            <span className="w-9 h-9 rounded-xl grid place-items-center text-base" style={{ background: "var(--success-soft)" }} aria-hidden>
              ✓
            </span>
            <h2 className="title flex-1">Dans le caddie</h2>
            <span className="badge success">{done.length}</span>
            <span className="text-ink-faint text-xs">{showDone ? "▲" : "▼"}</span>
          </button>
          {showDone && (
            <div className="mt-2">
              {done.map((item) => (
                <ShoppingRow key={item.id} familyId={familyId} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

function ShoppingRow({ familyId, item }: { familyId: string; item: ShoppingItem }) {
  return (
    <div className="row !py-2.5">
      <label className="check" title={item.done ? "Retirer du caddie" : "Mettre dans le caddie"}>
        <input
          type="checkbox"
          checked={item.done}
          onChange={(e) => toggleShoppingItem(familyId, item.id, e.target.checked)}
          aria-label={item.name}
        />
        <span className="box">
          <svg viewBox="0 0 16 16" aria-hidden>
            <polyline points="2.5,8.5 6.5,12 13.5,4" />
          </svg>
        </span>
      </label>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-semibold text-sm ${item.done ? "line-through text-ink-faint" : ""}`}>{item.name}</span>
          {item.qty && <span className="text-xs text-ink-dim tabular">{item.qty}</span>}
          {item.fromMealId && <span className="badge">🍽️ repas</span>}
          {item.fromInventoryId && <span className="badge warning">📦 stock bas</span>}
        </div>
      </div>

      {!item.done && (
        <select
          className="!w-auto !mb-0 !py-1.5 !px-2 text-xs shrink-0"
          value={item.category}
          onChange={(e) => setShoppingCategory(familyId, item.id, e.target.value as CategoryId)}
          aria-label={`Rayon de ${item.name}`}
          title={categoryOf(item.category).label}
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.label}
            </option>
          ))}
        </select>
      )}

      <button
        className="btn icon ghost shrink-0"
        style={{ color: "var(--danger)" }}
        onClick={() => deleteShoppingItem(familyId, item.id)}
        aria-label={`Supprimer ${item.name}`}
      >
        ✕
      </button>
    </div>
  );
}
