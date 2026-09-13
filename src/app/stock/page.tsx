"use client";

import { useMemo, useState } from "react";
import { AppShell, EmptyState, PageHeader } from "@/components/AppShell";
import { VoiceButton, VoiceUnsupportedHint } from "@/components/VoiceInput";
import { useAuth } from "@/context/AuthContext";
import { createInventoryItem, deleteInventoryItem, updateInventoryQty } from "@/lib/firestore-helpers";
import { CATEGORIES, categoryOf, guessCategory } from "@/lib/categories";
import { parseStockUpdate, suggestMeals, type MealSuggestResult } from "@/lib/ai";
import type { CategoryId, InventoryItem } from "@/types";

export default function StockPage() {
  const { familyId, inventory, activeMemberId } = useAuth();
  const [showNew, setShowNew] = useState(false);
  const [aiText, setAiText] = useState("");
  const [interim, setInterim] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [mealSuggestions, setMealSuggestions] = useState<MealSuggestResult["suggestions"] | null>(null);
  const [search, setSearch] = useState("");

  const low = useMemo(() => inventory.filter((i) => i.qty <= i.threshold), [inventory]);
  const ok = useMemo(() => inventory.filter((i) => i.qty > i.threshold), [inventory]);
  const filteredOk = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? ok.filter((i) => i.name.toLowerCase().includes(q)) : ok;
  }, [ok, search]);

  if (!familyId) return null;

  // Traite le texte dicte ou saisi : Gemini le convertit en mises a jour de stock.
  async function runAi(rawText: string) {
    const text = rawText.trim();
    if (!text || aiBusy) return;
    setAiBusy(true);
    setAiError(null);
    setAiSummary(null);
    setInterim("");
    try {
      const result = await parseStockUpdate(
        text,
        inventory.map((i) => ({ id: i.id, name: i.name, qty: i.qty, unit: i.unit }))
      );
      for (const u of result.updates) {
        const existing = u.id
          ? inventory.find((i) => i.id === u.id)
          : inventory.find((i) => i.name.toLowerCase() === u.name.toLowerCase());
        if (existing) {
          await updateInventoryQty(familyId!, existing, Math.max(0, u.newQty), activeMemberId ?? null);
        } else {
          await createInventoryItem(
            familyId!,
            { name: u.name, qty: Math.max(0, u.newQty), unit: u.unit, threshold: 1 },
            activeMemberId ?? null
          );
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

  // La dictee remplit le champ puis lance l'analyse : on parle, le stock se met a jour.
  function handleVoice(text: string) {
    setAiText(text);
    setInterim("");
    void runAi(text);
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
      <PageHeader
        eyebrow="Inventaire"
        title="Le stock de la maison"
        subtitle="Dis ce qui manque, l'assistant s'occupe du reste. Les articles sous leur seuil partent automatiquement dans la liste de courses."
        action={
          <button className="btn primary" onClick={() => setShowNew(true)}>
            <span aria-hidden>＋</span> Article
          </button>
        }
      />

      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <MiniStat label="Articles suivis" value={inventory.length} icon="📦" />
        <MiniStat label="Stock bas" value={low.length} icon="⚠️" tone={low.length > 0 ? "bad" : undefined} />
        <MiniStat label="Rayons couverts" value={new Set(inventory.map((i) => i.category)).size} icon="🗂️" />
      </div>

      {/* ---- Assistant IA + dictee ---- */}
      <div className="card card-lg card-accent mb-5 animate-in">
        <div className="flex items-start gap-3 mb-4">
          <span className="w-10 h-10 rounded-xl grid place-items-center text-lg shrink-0" style={{ background: "var(--section-soft)" }}>
            ✨
          </span>
          <div className="min-w-0">
            <h2 className="title">Assistant stock</h2>
            <p className="text-xs text-ink-dim mt-0.5">
              Ecris ou dicte une phrase du quotidien — « il reste presque plus de lait », « j'ai achete 2 kg de riz » — et le stock
              se met a jour tout seul.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            className="!mb-0 flex-1"
            value={interim || aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="Ex : il ne reste presque plus de lait"
            onKeyDown={(e) => e.key === "Enter" && runAi(aiText)}
            disabled={aiBusy}
          />
          <div className="flex gap-2">
            <VoiceButton onResult={handleVoice} onInterim={setInterim} label="Dicter" />
            <button className="btn primary flex-1 sm:flex-none" disabled={aiBusy || !aiText.trim()} onClick={() => runAi(aiText)}>
              {aiBusy ? "Analyse…" : "Analyser"}
            </button>
          </div>
        </div>

        <VoiceUnsupportedHint />

        {aiSummary && (
          <div className="mt-3 flex items-start gap-2 text-sm p-3 rounded-xl" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
            <span aria-hidden>✓</span>
            <span className="font-semibold">{aiSummary}</span>
          </div>
        )}
        {aiError && (
          <div className="mt-3 flex items-start gap-2 text-sm p-3 rounded-xl" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
            <span aria-hidden>✕</span>
            <span className="font-semibold">{aiError}</span>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-line">
          <button className="btn" disabled={aiBusy || inventory.length === 0} onClick={handleSuggestMeals}>
            <span aria-hidden>💡</span> Que cuisiner avec ce stock ?
          </button>
          {mealSuggestions && (
            <div className="mt-3 grid sm:grid-cols-3 gap-2 animate-in">
              {mealSuggestions.map((s, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-line" style={{ background: "var(--surface-2)" }}>
                  <p className="font-bold text-sm">{s.title}</p>
                  {s.usesFromStock?.length > 0 && (
                    <p className="text-[0.6875rem] text-ink-dim mt-1.5">
                      <span className="font-bold">Utilise :</span> {s.usesFromStock.join(", ")}
                    </p>
                  )}
                  {s.note && <p className="text-[0.6875rem] text-ink-faint mt-1">{s.note}</p>}
                </div>
              ))}
              {mealSuggestions.length === 0 && <p className="text-xs text-ink-faint">Aucune suggestion pour l'instant.</p>}
            </div>
          )}
        </div>
      </div>

      {/* ---- Stock bas ---- */}
      {low.length > 0 && (
        <div
          className="card card-lg mb-5 animate-in"
          style={{ borderColor: "var(--danger)", background: "color-mix(in srgb, var(--danger-soft) 55%, var(--surface))" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <h2 className="title" style={{ color: "var(--danger)" }}>
              ⚠️ Stock bas
            </h2>
            <span className="badge danger">{low.length}</span>
          </div>
          <div>
            {low.map((item) => (
              <StockRow key={item.id} familyId={familyId} item={item} activeMemberId={activeMemberId ?? null} />
            ))}
          </div>
        </div>
      )}

      {/* ---- Stock suffisant ---- */}
      <div className="card card-lg animate-in">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <h2 className="title">Stock suffisant</h2>
            <span className="badge">{ok.length}</span>
          </div>
          {ok.length > 4 && (
            <input
              type="search"
              className="!mb-0 !w-auto min-w-[12rem]"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
        </div>
        {filteredOk.length === 0 ? (
          <EmptyState
            icon={ok.length === 0 ? "📦" : "🔍"}
            title={ok.length === 0 ? "Aucun article en stock" : "Aucun resultat"}
            hint={ok.length === 0 ? "Ajoute un article, ou dicte ce que tu as dans les placards." : undefined}
          />
        ) : (
          <div>
            {filteredOk.map((item) => (
              <StockRow key={item.id} familyId={familyId} item={item} activeMemberId={activeMemberId ?? null} />
            ))}
          </div>
        )}
      </div>

      {showNew && <NewInventoryModal familyId={familyId} activeMemberId={activeMemberId ?? null} onClose={() => setShowNew(false)} />}
    </AppShell>
  );
}

function MiniStat({ label, value, icon, tone }: { label: string; value: number; icon: string; tone?: "bad" }) {
  return (
    <div className="card flex items-center gap-3">
      <span className="w-10 h-10 rounded-xl grid place-items-center text-lg shrink-0" style={{ background: tone === "bad" ? "var(--danger-soft)" : "var(--section-soft)" }}>
        {icon}
      </span>
      <div>
        <div className="text-2xl font-extrabold tabular leading-none" style={tone === "bad" && value > 0 ? { color: "var(--danger)" } : undefined}>
          {value}
        </div>
        <div className="text-[0.6875rem] font-bold text-ink-faint mt-1">{label}</div>
      </div>
    </div>
  );
}

function StockRow({ familyId, item, activeMemberId }: { familyId: string; item: InventoryItem; activeMemberId: string | null }) {
  const cat = categoryOf(item.category);
  // Jauge de remplissage relative au seuil : au-dela du double du seuil, la barre est pleine.
  const fill = Math.min(100, item.threshold > 0 ? (item.qty / (item.threshold * 2)) * 100 : 100);

  return (
    <div className="row">
      <span className="w-9 h-9 rounded-xl grid place-items-center text-base shrink-0" style={{ background: "var(--surface-2)" }} title={cat.label}>
        {cat.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-bold text-sm truncate">{item.name}</span>
          <span className="text-xs text-ink-dim tabular">
            {item.qty} {item.unit}
          </span>
          <span className="text-[0.6875rem] text-ink-faint">seuil {item.threshold}</span>
        </div>
        <div className="meter mt-1.5 max-w-[10rem]">
          <span style={{ width: `${fill}%`, background: item.qty <= item.threshold ? "var(--danger)" : undefined }} />
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          className="btn icon"
          onClick={() => updateInventoryQty(familyId, item, Math.max(0, item.qty - 1), activeMemberId)}
          aria-label={`Retirer une unite de ${item.name}`}
        >
          −
        </button>
        <button
          className="btn icon"
          onClick={() => updateInventoryQty(familyId, item, item.qty + 1, activeMemberId)}
          aria-label={`Ajouter une unite de ${item.name}`}
        >
          ＋
        </button>
        <button
          className="btn icon ghost"
          style={{ color: "var(--danger)" }}
          onClick={() => deleteInventoryItem(familyId, item.id)}
          aria-label={`Supprimer ${item.name}`}
        >
          ✕
        </button>
      </div>
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

  function applyName(value: string) {
    setName(value);
    if (!userSetCategory) setCategory(guessCategory(value));
  }

  async function save() {
    if (!name.trim()) return;
    await createInventoryItem(familyId, { name: name.trim(), qty, unit, threshold, category }, activeMemberId);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: "rgba(20, 14, 8, 0.45)", backdropFilter: "blur(3px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Nouvel article de stock"
    >
      <div className="card card-lg w-full max-w-sm shadow-xl animate-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="title-lg">Nouvel article</h2>
          <button className="btn icon ghost" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <label className="field-label" htmlFor="stock-name">
          Nom
        </label>
        <div className="flex gap-2">
          <input id="stock-name" type="text" value={name} onChange={(e) => applyName(e.target.value)} placeholder="Lait" autoFocus />
          <VoiceButton onResult={applyName} label="" className="icon shrink-0 !mb-3" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="stock-qty">
              Quantite
            </label>
            <input id="stock-qty" type="number" min={0} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </div>
          <div>
            <label className="field-label" htmlFor="stock-unit">
              Unite
            </label>
            <input id="stock-unit" type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="L, kg, pcs…" />
          </div>
        </div>

        <label className="field-label" htmlFor="stock-threshold">
          Seuil d'alerte — stock bas si la quantite descend a ce niveau
        </label>
        <input id="stock-threshold" type="number" min={0} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />

        <label className="field-label" htmlFor="stock-cat">
          Rayon
        </label>
        <select
          id="stock-cat"
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

        <div className="flex gap-2 mt-2">
          <button className="btn ghost flex-1" onClick={onClose}>
            Annuler
          </button>
          <button className="btn primary flex-1" onClick={save} disabled={!name.trim()}>
            Creer
          </button>
        </div>
      </div>
    </div>
  );
}
