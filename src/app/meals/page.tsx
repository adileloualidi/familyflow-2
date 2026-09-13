"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { deleteMeal, saveMeal } from "@/lib/firestore-helpers";
import { MEAL_SLOTS, type Meal, type MealIngredient, type MealSlot } from "@/types";

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(ref: Date) {
  const d = new Date(ref);
  const day = (d.getDay() + 6) % 7; // lundi = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekDates(ref: Date) {
  const start = startOfWeek(ref);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const DAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export default function MealsPage() {
  const { familyId, meals, activeMemberId } = useAuth();
  const [weekRef, setWeekRef] = useState(() => new Date());
  const [editing, setEditing] = useState<{ date: string; slot: MealSlot; meal?: Meal } | null>(null);

  const dates = useMemo(() => weekDates(weekRef), [weekRef]);

  if (!familyId) return null;

  function mealFor(dateStr: string, slot: MealSlot) {
    return meals.find((m) => m.date === dateStr && m.slot === slot);
  }

  function shiftWeek(days: number) {
    setWeekRef((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + days);
      return d;
    });
  }

  return (
    <AppShell>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-extrabold">Planning des repas</h2>
        <div className="flex gap-2 items-center">
          <button className="btn text-xs" onClick={() => shiftWeek(-7)}>
            ← Semaine precedente
          </button>
          <button className="btn text-xs" onClick={() => setWeekRef(new Date())}>
            Aujourd'hui
          </button>
          <button className="btn text-xs" onClick={() => shiftWeek(7)}>
            Semaine suivante →
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-7 gap-2">
        {dates.map((d, i) => {
          const dateStr = toDateStr(d);
          const isToday = toDateStr(new Date()) === dateStr;
          return (
            <div key={dateStr} className={`card !p-2 ${isToday ? "border-2 border-accent" : ""}`}>
              <div className="text-xs font-bold opacity-70 mb-2">
                {DAY_LABELS[i]} <span className="opacity-50">{d.getDate()}/{d.getMonth() + 1}</span>
              </div>
              <div className="flex flex-col gap-1">
                {MEAL_SLOTS.map((slot) => {
                  const meal = mealFor(dateStr, slot.value);
                  return (
                    <button
                      key={slot.value}
                      className="text-left text-xs p-2 rounded-lg bg-[var(--surface-2)] hover:opacity-80"
                      onClick={() => setEditing({ date: dateStr, slot: slot.value, meal })}
                    >
                      <div className="font-bold opacity-60">{slot.label}</div>
                      <div className="truncate">{meal ? meal.title : "+ Ajouter"}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <MealModal
          familyId={familyId}
          activeMemberId={activeMemberId ?? null}
          date={editing.date}
          slot={editing.slot}
          meal={editing.meal}
          onClose={() => setEditing(null)}
        />
      )}
    </AppShell>
  );
}

function MealModal({
  familyId,
  activeMemberId,
  date,
  slot,
  meal,
  onClose,
}: {
  familyId: string;
  activeMemberId: string | null;
  date: string;
  slot: MealSlot;
  meal?: Meal;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(meal?.title ?? "");
  const [ingredients, setIngredients] = useState<MealIngredient[]>(meal?.ingredients ?? []);
  const [ingName, setIngName] = useState("");
  const [ingQty, setIngQty] = useState("");
  const [ingUnit, setIngUnit] = useState("");
  const slotLabel = MEAL_SLOTS.find((s) => s.value === slot)?.label ?? slot;

  function addIngredient() {
    if (!ingName.trim()) return;
    setIngredients((prev) => [...prev, { name: ingName.trim(), qty: Number(ingQty) || 0, unit: ingUnit.trim() }]);
    setIngName("");
    setIngQty("");
    setIngUnit("");
  }

  function removeIngredient(idx: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  }

  async function save() {
    if (!title.trim()) return;
    await saveMeal(familyId, { date, slot, title: title.trim(), ingredients }, activeMemberId, meal);
    onClose();
  }

  async function remove() {
    if (!meal) return;
    await deleteMeal(familyId, meal);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card w-full max-w-md">
        <div className="flex justify-between mb-2">
          <h3 className="font-bold text-lg">
            {slotLabel} — {date}
          </h3>
          <button onClick={onClose} className="opacity-60">
            ✕
          </button>
        </div>

        <label className="text-xs font-bold opacity-70">Plat</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Poulet-riz" />

        <label className="text-xs font-bold opacity-70">Ingredients</label>
        <div className="flex flex-col gap-1 mb-2">
          {ingredients.map((ing, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm py-1 border-b border-[var(--border)]">
              <span className="flex-1">{ing.name}</span>
              <span className="opacity-60 text-xs">
                {ing.qty} {ing.unit}
              </span>
              <button className="btn danger text-xs" onClick={() => removeIngredient(idx)}>
                ✕
              </button>
            </div>
          ))}
          {ingredients.length === 0 && <p className="text-xs opacity-50">Aucun ingredient ajoute.</p>}
        </div>

        <div className="grid grid-cols-[1fr_70px_70px_auto] gap-2 items-end mb-3">
          <div>
            <input type="text" value={ingName} onChange={(e) => setIngName(e.target.value)} placeholder="Ingredient" onKeyDown={(e) => e.key === "Enter" && addIngredient()} />
          </div>
          <div>
            <input type="number" value={ingQty} onChange={(e) => setIngQty(e.target.value)} placeholder="Qte" onKeyDown={(e) => e.key === "Enter" && addIngredient()} />
          </div>
          <div>
            <input type="text" value={ingUnit} onChange={(e) => setIngUnit(e.target.value)} placeholder="Unite" onKeyDown={(e) => e.key === "Enter" && addIngredient()} />
          </div>
          <button className="btn text-xs" onClick={addIngredient}>
            +
          </button>
        </div>

        <p className="text-xs opacity-60 mb-2">
          Les ingredients ci-dessus seront ajoutes automatiquement a la liste de courses.
        </p>

        <div className="flex justify-between">
          <button className="btn primary" onClick={save}>
            Enregistrer
          </button>
          {meal && (
            <button className="btn danger" onClick={remove}>
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
