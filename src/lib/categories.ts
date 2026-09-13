import type { CategoryId } from "@/types";

export const CATEGORIES: { id: CategoryId; label: string; icon: string; keywords: string[] }[] = [
  { id: "fruits_legumes", label: "Fruits & Legumes", icon: "🥦", keywords: ["pomme","banane","poire","salade","tomate","carotte","oignon","ail","courgette","poivron","citron","orange","fraise","raisin","legume","fruit","pomme de terre","patate","concombre","avocat","champignon","brocoli","epinard","haricot vert","persil","herbe"] },
  { id: "viande_poisson", label: "Viande & Poisson", icon: "🥩", keywords: ["poulet","boeuf","porc","viande","saucisse","merguez","steak","poisson","saumon","thon","crevette","agneau","dinde","jambon","lardons","escalope","filet","cotelette"] },
  { id: "cremerie", label: "Cremerie & Oeufs", icon: "🧀", keywords: ["lait","yaourt","fromage","beurre","creme","oeuf","yop","petit suisse","emmental","gruyere","mozzarella","camembert"] },
  { id: "boulangerie", label: "Boulangerie", icon: "🥖", keywords: ["pain","baguette","brioche","croissant","viennoiserie","farine"] },
  { id: "epicerie", label: "Epicerie", icon: "🥫", keywords: ["pates","riz","semoule","couscous","huile","sucre","sel","poivre","epice","conserve","sauce","lentille","pois chiche","chocolat","cereale","biscuit","confiture","miel","vinaigre","bouillon"] },
  { id: "surgeles", label: "Surgeles", icon: "🧊", keywords: ["surgele","glace","frite surgelee"] },
  { id: "boissons", label: "Boissons", icon: "🥤", keywords: ["eau","jus","soda","cola","the","cafe","vin","biere","lait vegetal","sirop"] },
  { id: "hygiene", label: "Hygiene & Entretien", icon: "🧴", keywords: ["savon","shampoing","dentifrice","lessive","eponge","papier toilette","essuie-tout","liquide vaisselle","couche","deodorant"] },
  { id: "autre", label: "Autre", icon: "🛒", keywords: [] },
];

export function categoryOf(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]!;
}

const DIACRITICS = /[̀-ͯ]/g;

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(DIACRITICS, "");
}

export function guessCategory(name: string): CategoryId {
  const n = normalize(name || "");
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((k) => n.includes(normalize(k)))) return cat.id;
  }
  return "autre";
}
