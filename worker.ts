// Worker Cloudflare : sert le site statique (dossier out/, genere par `npm run build`)
// et gere la route /api/ai (proxy serveur vers l'API Gemini, cle jamais exposee au client).
// Remplace l'ancienne approche "Cloudflare Pages Function" (functions/api/ai.ts) devenue
// inutile avec la nouvelle interface Cloudflare unifiee (Workers + assets statiques).

export interface Env {
  ASSETS: Fetcher;
  GEMINI_API_KEY: string;
}

interface StockUpdateRequest {
  mode: "stock-update";
  text: string;
  inventory: { id: string; name: string; qty: number; unit: string }[];
}

interface MealSuggestRequest {
  mode: "meal-suggest";
  inventory: { name: string; qty: number; unit: string }[];
  count?: number;
}

type AiRequest = StockUpdateRequest | MealSuggestRequest;

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini error ${res.status}: ${errText}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Reponse Gemini vide");
  return text;
}

function buildStockUpdatePrompt(req: StockUpdateRequest): string {
  const list = req.inventory.map((i) => `- id="${i.id}" nom="${i.name}" qte_actuelle=${i.qty} unite="${i.unit}"`).join("\n");
  return `Tu es un assistant qui met a jour un inventaire de courses familial a partir d'une phrase en francais.

Inventaire actuel :
${list || "(vide)"}

Phrase de l'utilisateur : "${req.text}"

Analyse la phrase et determine quel(s) article(s) de l'inventaire sont concernes et quelle est la nouvelle
quantite estimee (ou une estimation relative comme "presque plus" = tres faible quantite, "il n'y a plus" = 0,
"j'ai achete 2 de plus" = qte_actuelle + 2). Si l'article n'existe pas dans l'inventaire, propose de le creer.

Reponds STRICTEMENT en JSON, sans texte autour, avec ce format :
{
  "updates": [ { "id": "id existant ou null", "name": "nom de l'article", "newQty": nombre, "unit": "unite" } ],
  "summary": "phrase courte en francais resumant ce qui a ete compris"
}`;
}

function buildMealSuggestPrompt(req: MealSuggestRequest): string {
  const list = req.inventory.map((i) => `- ${i.name} (${i.qty} ${i.unit})`).join("\n");
  const count = req.count ?? 3;
  return `Tu es un assistant culinaire pour une famille. Voici le stock actuel de nourriture disponible :

${list || "(stock vide)"}

Propose ${count} idees de repas realisables principalement avec ce stock (des ingredients de base comme sel,
poivre, huile peuvent etre supposes disponibles meme s'ils ne sont pas dans la liste). Pour chaque repas,
indique le titre et les ingredients du stock utilises.

Reponds STRICTEMENT en JSON, sans texte autour, avec ce format :
{
  "suggestions": [ { "title": "nom du plat", "usesFromStock": ["ingredient1", "ingredient2"], "note": "courte astuce ou ce qu'il faudrait ajouter" } ]
}`;
}

async function handleAi(request: Request, env: Env): Promise<Response> {
  if (!env.GEMINI_API_KEY) {
    return jsonResponse({ error: "GEMINI_API_KEY non configuree sur Cloudflare." }, 500);
  }
  let body: AiRequest;
  try {
    body = (await request.json()) as AiRequest;
  } catch {
    return jsonResponse({ error: "Corps de requete JSON invalide." }, 400);
  }
  try {
    if (body.mode === "stock-update") {
      const text = await callGemini(env.GEMINI_API_KEY, buildStockUpdatePrompt(body));
      return jsonResponse(JSON.parse(text));
    }
    if (body.mode === "meal-suggest") {
      const text = await callGemini(env.GEMINI_API_KEY, buildMealSuggestPrompt(body));
      return jsonResponse(JSON.parse(text));
    }
    return jsonResponse({ error: "mode inconnu" }, 400);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "Erreur inconnue" }, 500);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/ai") {
      if (request.method === "POST") return handleAi(request, env);
      return jsonResponse({ ok: true, info: "Utilise POST avec { mode: 'stock-update' | 'meal-suggest', ... }" });
    }
    // Toutes les autres requetes : sert le site statique genere par `npm run build` (dossier out/).
    return env.ASSETS.fetch(request);
  },
};
