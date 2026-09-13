"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { createInventoryItem, deleteInventoryItem, updateInventoryQty } from "@/lib/firestore-helpers";
import { CATEGORIES, categoryOf, guessCategory } from "@/lib/categories";
import { parseStockUpdate, suggestMeals, type MealSuggestResult } from "@/lib/ai";
import type { CategoryId } from "@/types";

export default function StockPage() {
  const { familyId, inventory, activeMemberId } = useAuth();
  const [showNew, setShowNew] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [mealSuggestions, setMealSuggestions] = useState<MealSuggestResult["suggestions"] | null>(null);

  if (!familyId) return null;

  const low = inventory.filter((i) => i.qty <= i.threshold);
  const ok = inventory.filter((i) => i.qty > i.threshold);

  async function handleAiUpdate() {
    if (!aiText.trim()) return;
    setAiBusy(true);
    setAiError(null);
    setAiSummary(null);
    try {
      const result = await parseStockUpdate(
        aiText.trim(),
        inventory.map((i) => ({ id: i.id, name: i.name, qty: i.qty, unit: i.unit }))
      );
      for (const u of result.updates) {
        const existing = u.id ? inventory.find((i) => i.id === u.id) : inventory.find((i) => i.name.toLowerCase() === u.name.toLowerCase());
        if (existing) {
          await updateInventoryQty(familyId!, existing, Math.max(0, u.newQty), activeMemberId ?? null);
        } else {
          await createInventoryItem(familyId!, { name: u.name, qty: Math.max(0, u.newQty), unit: u.unit, threshold: 1 }, activeMemberId ?? null);
        }
      }
      setAiSummary(result.summary);
      setAiText("");
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Erreur IA");
    } finally {
      setAiBusy(false);
    }
  }

  async function handleSuggestMeals() {
    setAiBusy(true);
    setAiError(null);
    setMealSuggestions(null);
    try {
      const result = await suggestMeals(inventory.map((i) => ({ name: i.name, qty: i.qty, unit: i.unit })));
      setMealSuggestions(result.suggestions);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Erreur IA");
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-extrabold">Stock / Inventaire</h2>
        <button className="btn primary" onClick={() => setShowNew(true)}>
          + Article
        </button>
      </div>

      <div className="card mb-4">
        <h3 className="font-bold mb-2">🤖 Mise a jour par IA (Gemini)</h3>
        <p className="text-xs opacity-60 mb-2">
          Decris en une phrase ce qui manque ou ce que tu viens d'acheter, l'IA met a jour le stock.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="Ex: il reste presque plus de lait"
            onKeyDown={(e) => e.key === "Enter" && handleAiUpdate()}
          />
          <button className="btn primary" disabled={aiBusy} onClick={handleAiUpdate}>
            {aiBusy ? "..." : "Analyser"}
          </button>
        </div>
        {aiSummary && <p className="text-xs text-emerald-600 mt-2">{aiSummary}</p>}
        {aiError && <p className="text-xs text-red-600 mt-2">{aiError}</p>}

        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <button className="btn text-xs" disabled={aiBusy} onClick={handleSuggestMeals}>
            💡 Suggerer des repas avec le stock actuel
          </button>
          {mealSuggestions && (
            <div className="mt-2 flex flex-col gap-2">
              {mealSuggestions.map((s, idx) => (
                <div key={idx} className="text-sm p-2 rounded-lg bg-[var(--surface-2)]">
                  <b>{s.title}</b>
                  {s.usesFromStock?.length > 0 && <div className="text-xs opacity-60">Utilise: {s.usesFromStock.join(", ")}</div>}
                  {s.note && <div className="text-xs opacity-60">{s.note}</div>}
                </div>
              ))}
              {mealSuggestions.length === 0 && <p className="text-xs opacity-60">Aucune suggestion.</p>}
            </div>
          )}
        </div>
      </div>

      {low.length > 0 && (
        <div className="card mb-4 border-2 border-red-400">
          <h3 className="font-bold mb-2 text-red-600">⚠️ Stock bas ({low.length})</h3>
          <div className="flex flex-col gap-1">
            {low.map((item) => (
              <div key={item.id} className="flex items-center gap-2 py-1 border-b border-[var(--border)] last:border-0">
                <span>{categoryOf(item.category).icon}</span>
                <div className="flex-1">
                  <b>{item.name}</b>
                  <span className="text-xs opacity-60 ml-2">
                    {item.qty} {item.unit} (seuil {item.threshold})
                  </span>
                </div>
                <QtyControls familyId={familyId} item={item} activeMemberId={activeMemberId ?? null} />
                <button className="btn danger text-xs" onClick={() => deleteInventoryItem(familyId, item.id)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="font-bold mb-2">Stock suffisant ({ok.length})</h3>
        {ok.length === 0 && <p className="text-sm opacity-60">Aucun article.</p>}
        <div className="flex flex-col gap-1">
          {ok.map((item) => (
            <div key={item.id} className="flex items-center gap-2 py-1 border-b border-[var(--border)] last:border-0">
              <span>{categoryOf(item.category).icon}</span>
              <div className="flex-1">
                <span>{item.name}</span>
                <span className="text-xs opacity-60 ml-2">
                  {item.qty} {item.unit} (seuil {item.threshold})
                </span>
              </div>
              <QtyControls familyId={familyId} item={item} activeMemberId={activeMemberId ?? null} />
              <button className="btn danger text-xs" onClick={() => deleteInventoryItem(familyId, item.id)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {showNew && <NewInventoryModal familyId={familyId} activeMemberId={activeMemberId ?? null} onClose={() => setShowNew(false)} />}
    </AppShell>
  );
}

function QtyControls({
  familyId,
  item,
  activeMemberId,
}: {
  familyId: string;
  item: { id: string; qty: number; threshold: number; name: string; category: CategoryId; unit: string; alerted: boolean; updatedAt: string; updatedBy: string | null; createdAt: string; familyId: string };
  activeMemberId: string | null;
}) {
  return (
    <div className="flex items-center gap-1">
      <button className="btn text-xs" onClick={() => updateInventoryQty(familyId, item, Math.max(0, item.qty - 1), activeMemberId)}>
        −
      </button>
      <button className="btn text-xs" onClick={() => updateInventoryQty(familyId, item, item.qty + 1, activeMemberId)}>
        +
      </button>
    </div>
  );
}

function NewInventoryModal({
  familyId,
  activeMemberId,
  onClose,
}: {
  familyId: string;
  activeMemberId: string | null;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState("");
  const [threshold, setThreshold] = useState(1);
  const [category, setCategory] = useState<CategoryId>("autre");
  const [userSetCategory, setUserSetCategory] = useState(false);

  async function save() {
    if (!name.trim()) return;
    await createInventoryItem(familyId, { name: name.trim(), qty, unit, threshold, category }, activeMemberId);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card w-full max-w-sm">
        <div className="flex justify-between mb-2">
          <h3 className="font-bold text-lg">Nouvel article de stock</h3>
          <button onClick={onClose} className="opacity-60">
            ✕
          </button>
        </div>
        <label className="text-xs font-bold opacity-70">Nom</label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!userSetCategory) setCategory(guessCategory(e.target.value));
          }}
          placeholder="Lait"
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-bold opacity-70">Quantite actuelle</label>
            <input type="number" min={0} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs font-bold opacity-70">Unite</label>
            <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="L, kg, pcs..." />
          </div>
        </div>
        <label className="text-xs font-bold opacity-70">Seuil d'alerte (stock bas si ≤)</label>
        <input type="number" min={0} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
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
        <button className="btn primary mt-2" onClick={save}>
          Creer
        </button>
      </div>
    </div>
  );
}
