"use client";

import { useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { VoiceButton } from "@/components/VoiceInput";
import { useAuth } from "@/context/AuthContext";
import { deleteMeal, saveMeal } from "@/lib/firestore-helpers";
import { todayISO } from "@/lib/dates";
import { MEAL_SLOTS, type Meal, type MealIngredient, type MealSlot } from "@/types";

function toDateStr(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
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
const SLOT_ICONS: Record<MealSlot, string> = { "petit-dejeuner": "☕", dejeuner: "🍽️", diner: "🌙" };

export default function MealsPage() {
  const { familyId, meals, activeMemberId } = useAuth();
  const [weekRef, setWeekRef] = useState(() => new Date());
  const [editing, setEditing] = useState<{ date: string; slot: MealSlot; meal?: Meal } | null>(null);

  const dates = useMemo(() => weekDates(weekRef), [weekRef]);
  const today = todayISO();

  const weekMeals = useMemo(() => {
    const set = new Set(dates.map(toDateStr));
    return meals.filter((m) => set.has(m.date));
  }, [meals, dates]);

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

  const first = dates[0]!;
  const last = dates[6]!;
  const rangeLabel = `${first.getDate()}/${first.getMonth() + 1} — ${last.getDate()}/${last.getMonth() + 1}`;

  return (
    <AppShell>
      <PageHeader
        eyebrow={`Semaine du ${rangeLabel}`}
        title="Les repas"
        subtitle={`${weekMeals.length} repas planifie${weekMeals.length > 1 ? "s" : ""} cette semaine. Les ingredients rejoignent la liste de courses automatiquement.`}
        action={
          <div className="flex items-center gap-1">
            <button className="btn icon" onClick={() => shiftWeek(-7)} aria-label="Semaine precedente">
              ←
            </button>
            <button className="btn" onClick={() => setWeekRef(new Date())}>
              Aujourd'hui
            </button>
            <button className="btn icon" onClick={() => shiftWeek(7)} aria-label="Semaine suivante">
              →
            </button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {dates.map((d, i) => {
          const dateStr = toDateStr(d);
          const isToday = dateStr === today;
          const isPast = dateStr < today;
          return (
            <div
              key={dateStr}
              className="card !p-3 animate-in"
              style={
                isToday
                  ? { borderColor: "var(--section)", boxShadow: "0 0 0 3px color-mix(in srgb, var(--section) 13%, transparent), var(--shadow-md)" }
                  : isPast
                    ? { opacity: 0.68 }
                    : undefined
              }
            >
              <div className="flex items-baseline justify-between mb-2.5 px-0.5">
                <span className="text-[0.8125rem] font-extrabold" style={isToday ? { color: "var(--section)" } : undefined}>
                  {DAY_LABELS[i]}
                </span>
                <span className="text-[0.6875rem] font-bold text-ink-faint tabular">
                  {d.getDate()}/{d.getMonth() + 1}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {MEAL_SLOTS.map((slot) => {
                  const meal = mealFor(dateStr, slot.value);
                  return (
                    <button
                      key={slot.value}
                      className="text-left p-2.5 rounded-xl border transition-colors"
                      style={{
                        background: meal ? "var(--section-soft)" : "var(--surface-2)",
                        borderColor: meal ? "transparent" : "var(--border)",
                      }}
                      onClick={() => setEditing({ date: dateStr, slot: slot.value, meal })}
                    >
                      <div className="flex items-center gap-1.5 text-[0.625rem] font-extrabold text-ink-faint uppercase tracking-wide">
                        <span aria-hidden>{SLOT_ICONS[slot.value]}</span>
                        {slot.label}
                      </div>
                      <div className={`text-[0.8125rem] mt-0.5 truncate ${meal ? "font-bold" : "text-ink-faint"}`}>
                        {meal ? meal.title : "Ajouter"}
                      </div>
                      {meal && meal.ingredients.length > 0 && (
                        <div className="text-[0.625rem] text-ink-dim mt-0.5">{meal.ingredients.length} ingredients</div>
                      )}
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
  const [busy, setBusy] = useState(false);
  const slotLabel = MEAL_SLOTS.find((s) => s.value === slot)?.label ?? slot;

  function addIngredient(nameOverride?: string) {
    const value = (nameOverride ?? ingName).trim();
    if (!value) return;
    setIngredients((prev) => [...prev, { name: value, qty: Number(ingQty) || 0, unit: ingUnit.trim() }]);
    setIngName("");
    setIngQty("");
    setIngUnit("");
  }

  function removeIngredient(idx: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  }

  async function save() {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await saveMeal(familyId, { date, slot, title: title.trim(), ingredients }, activeMemberId, meal);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!meal || busy) return;
    setBusy(true);
    try {
      await deleteMeal(familyId, meal);
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
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="eyebrow">{date}</p>
            <h2 className="title-lg mt-1">
              {SLOT_ICONS[slot]} {slotLabel}
            </h2>
          </div>
          <button className="btn icon ghost" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <label className="field-label" htmlFor="meal-title">
          Plat
        </label>
        <div className="flex gap-2">
          <input id="meal-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Poulet au riz" autoFocus />
          <VoiceButton onResult={setTitle} label="" className="icon shrink-0 !mb-3" />
        </div>

        <label className="field-label">Ingredients</label>
        <div className="mb-3">
          {ingredients.map((ing, idx) => (
            <div key={idx} className="row !py-2">
              <span className="flex-1 text-sm font-semibold">{ing.name}</span>
              {(ing.qty > 0 || ing.unit) && (
                <span className="text-xs text-ink-dim tabular">
                  {ing.qty || ""} {ing.unit}
                </span>
              )}
              <button className="btn icon ghost" style={{ color: "var(--danger)" }} onClick={() => removeIngredient(idx)} aria-label={`Retirer ${ing.name}`}>
                ✕
              </button>
            </div>
          ))}
          {ingredients.length === 0 && <p className="text-xs text-ink-faint py-2">Aucun ingredient pour l'instant.</p>}
        </div>

        <div className="grid grid-cols-[1fr_70px_72px_auto_auto] gap-2 items-end mb-3">
          <input
            type="text"
            className="!mb-0"
            value={ingName}
            onChange={(e) => setIngName(e.target.value)}
            placeholder="Ingredient"
            onKeyDown={(e) => e.key === "Enter" && addIngredient()}
          />
          <input
            type="number"
            className="!mb-0"
            value={ingQty}
            onChange={(e) => setIngQty(e.target.value)}
            placeholder="Qte"
            onKeyDown={(e) => e.key === "Enter" && addIngredient()}
          />
          <input
            type="text"
            className="!mb-0"
            value={ingUnit}
            onChange={(e) => setIngUnit(e.target.value)}
            placeholder="Unite"
            onKeyDown={(e) => e.key === "Enter" && addIngredient()}
          />
          <VoiceButton onResult={(t) => addIngredient(t)} label="" className="icon" />
          <button className="btn icon" onClick={() => addIngredient()} aria-label="Ajouter l'ingredient">
            ＋
          </button>
        </div>

        <p className="text-xs text-ink-faint mb-4">Ces ingredients rejoindront automatiquement la liste de courses.</p>

        <div className="flex gap-2">
          {meal && (
            <button className="btn" style={{ color: "var(--danger)" }} onClick={remove} disabled={busy}>
              Supprimer
            </button>
          )}
          <button className="btn ghost flex-1" onClick={onClose}>
            Annuler
          </button>
          <button className="btn primary flex-1" onClick={save} disabled={busy || !title.trim()}>
            {busy ? "…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
