"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { addShoppingItem, deleteShoppingItem, setShoppingCategory, toggleShoppingItem } from "@/lib/firestore-helpers";
import { CATEGORIES, categoryOf, guessCategory } from "@/lib/categories";
import type { CategoryId } from "@/types";

export default function ShoppingPage() {
  const { familyId, shopping, activeMemberId } = useAuth();
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [category, setCategory] = useState<CategoryId>("autre");
  const [userSetCategory, setUserSetCategory] = useState(false);

  if (!familyId) return null;

  async function handleAdd() {
    if (!name.trim()) return;
    await addShoppingItem(familyId!, {
      name: name.trim(),
      qty: qty.trim(),
      category,
      addedBy: activeMemberId ?? null,
    });
    setName("");
    setQty("");
    setCategory("autre");
    setUserSetCategory(false);
  }

  const todo = shopping.filter((s) => !s.done);
  const done = shopping.filter((s) => s.done);

  const groups = CATEGORIES.map((c) => ({
    cat: c,
    items: todo.filter((s) => s.category === c.id),
  })).filter((g) => g.items.length > 0);

  return (
    <AppShell>
      <h2 className="text-xl font-extrabold mb-4">Liste de courses</h2>

      <div className="card mb-4">
        <h3 className="font-bold mb-2">Ajouter un article</h3>
        <div className="grid md:grid-cols-[1fr_120px_180px_auto] gap-2 items-end">
          <div>
            <label className="text-xs font-bold opacity-70">Article</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!userSetCategory) setCategory(guessCategory(e.target.value));
              }}
              placeholder="Ex: Tomates"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div>
            <label className="text-xs font-bold opacity-70">Quantite</label>
            <input type="text" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="1 kg" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
          </div>
          <div>
            <label className="text-xs font-bold opacity-70">Rayon</label>
            <select
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
          <button className="btn primary" onClick={handleAdd}>
            Ajouter
          </button>
        </div>
      </div>

      {groups.length === 0 && done.length === 0 && <p className="opacity-60 text-sm">Liste vide pour le moment.</p>}

      {groups.map((g) => (
        <div key={g.cat.id} className="card mb-3">
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <span>{g.cat.icon}</span>
            <span>{g.cat.label}</span>
            <span className="text-xs opacity-50 font-normal">({g.items.length})</span>
          </h3>
          <div className="flex flex-col gap-1">
            {g.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 py-1 border-b border-[var(--border)] last:border-0">
                <input type="checkbox" checked={item.done} onChange={(e) => toggleShoppingItem(familyId, item.id, e.target.checked)} className="!w-auto !mb-0" />
                <div className="flex-1">
                  <span className="font-semibold">{item.name}</span>
                  {item.qty && <span className="text-xs opacity-60 ml-2">{item.qty}</span>}
                  {item.fromMealId && <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded-full bg-[var(--surface-2)]">repas</span>}
                  {item.fromInventoryId && <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded-full bg-[var(--surface-2)]">stock bas</span>}
                </div>
                <select
                  className="!w-auto !mb-0 text-xs"
                  value={item.category}
                  onChange={(e) => setShoppingCategory(familyId, item.id, e.target.value as CategoryId)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
                <button className="btn danger text-xs" onClick={() => deleteShoppingItem(familyId, item.id)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {done.length > 0 && (
        <div className="card opacity-70">
          <h3 className="font-bold mb-2">Dans le caddie ({done.length})</h3>
          <div className="flex flex-col gap-1">
            {done.map((item) => (
              <div key={item.id} className="flex items-center gap-2 py-1 border-b border-[var(--border)] last:border-0">
                <input type="checkbox" checked={item.done} onChange={(e) => toggleShoppingItem(familyId, item.id, e.target.checked)} className="!w-auto !mb-0" />
                <div className="flex-1 line-through">
                  <span>{categoryOf(item.category).icon} {item.name}</span>
                  {item.qty && <span className="text-xs opacity-60 ml-2">{item.qty}</span>}
                </div>
                <button className="btn danger text-xs" onClick={() => deleteShoppingItem(familyId, item.id)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
