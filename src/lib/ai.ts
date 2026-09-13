// Client leger pour la fonction Cloudflare Pages /api/ai (proxy Gemini).
// Ne fonctionne qu'une fois deploye sur Cloudflare Pages (voir functions/api/ai.ts) —
// en developpement local (`next dev`), l'appel echouera puisque la fonction n'existe
// que sur l'infrastructure Cloudflare : c'est attendu, l'erreur est remontee proprement.

export interface StockUpdateResult {
  updates: { id: string | null; name: string; newQty: number; unit: string }[];
  summary: string;
}

export interface MealSuggestResult {
  suggestions: { title: string; usesFromStock: string[]; note: string }[];
}

async function callAi<T>(payload: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Erreur IA (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function parseStockUpdate(
  text: string,
  inventory: { id: string; name: string; qty: number; unit: string }[]
): Promise<StockUpdateResult> {
  return callAi<StockUpdateResult>({ mode: "stock-update", text, inventory });
}

export function suggestMeals(
  inventory: { name: string; qty: number; unit: string }[],
  count = 3
): Promise<MealSuggestResult> {
  return callAi<MealSuggestResult>({ mode: "meal-suggest", inventory, count });
}
