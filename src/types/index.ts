export type Role = "admin" | "adult" | "child" | "guest";
export type MemberStatus = "active" | "suspended";

export interface Member {
  id: string;
  familyId: string;
  uid: string | null; // Firebase Auth uid, null pour un profil enfant sans compte propre
  name: string;
  role: Role;
  age: number | null;
  color: string;
  avatarUrl: string | null;
  status: MemberStatus;
  skills: string[];
  preferences: string[];
  availability: string[]; // jours de la semaine en minuscules: "lundi", "mardi", ...
  canCreateTasks: boolean;
  points: number;
  totalPointsEarned: number;
  tasksDone: number;
  streak: number;
  lastDoneDate: string | null; // yyyy-mm-dd
  badges: string[];
  createdAt: string;
}

export type TaskType = "simple" | "recurrente" | "programmee" | "conditionnelle" | "urgente";
export type TaskStatus =
  | "A faire"
  | "En attente"
  | "En cours"
  | "A valider"
  | "Terminee"
  | "Refusee"
  | "Annulee";

export interface Subtask {
  id: string;
  label: string;
  done: boolean;
}

export interface TaskComment {
  memberId: string;
  text: string;
  at: string;
}

export interface HistoryEntry {
  status: TaskStatus;
  at: string;
  by: string | null;
}

export interface Task {
  id: string;
  familyId: string;
  title: string;
  description: string;
  group: string;
  type: TaskType;
  status: TaskStatus;
  points: number;
  difficulty: "facile" | "moyen" | "difficile";
  estimatedMinutes: number;
  assigneeId: string | null;
  assignedMode: "manuel" | "auto";
  dueDate: string | null; // yyyy-mm-dd
  recurrence: string | null;
  minAge: number | null;
  subtasks: Subtask[];
  comments: TaskComment[];
  proofUrls: string[];
  createdBy: string | null;
  createdAt: string;
  completedAt: string | null;
  history: HistoryEntry[];
}

export interface Reward {
  id: string;
  familyId: string;
  title: string;
  cost: number;
  category: string;
  createdAt: string;
}

export interface Redemption {
  id: string;
  familyId: string;
  memberId: string;
  rewardId: string;
  rewardTitle: string;
  cost: number;
  status: "en attente" | "valide" | "refuse";
  at: string;
}

export interface Family {
  id: string;
  name: string;
  groups: string[];
  createdAt: string;
  ownerUid: string;
}

export type MealSlot = "petit-dejeuner" | "dejeuner" | "diner";

export interface MealIngredient {
  name: string;
  qty: number;
  unit: string; // "g", "kg", "L", "pcs", "" ...
}

export interface Meal {
  id: string;
  familyId: string;
  date: string; // yyyy-mm-dd
  slot: MealSlot;
  title: string;
  ingredients: MealIngredient[];
  createdBy: string | null;
  createdAt: string;
}

export const MEAL_SLOTS: { value: MealSlot; label: string }[] = [
  { value: "petit-dejeuner", label: "Petit-dejeuner" },
  { value: "dejeuner", label: "Dejeuner" },
  { value: "diner", label: "Diner" },
];

export type CategoryId =
  | "fruits_legumes"
  | "viande_poisson"
  | "cremerie"
  | "boulangerie"
  | "epicerie"
  | "surgeles"
  | "boissons"
  | "hygiene"
  | "autre";

export interface ShoppingItem {
  id: string;
  familyId: string;
  name: string;
  qty: string;
  category: CategoryId;
  done: boolean;
  fromMealId: string | null;
  fromInventoryId: string | null;
  addedBy: string | null;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  familyId: string;
  name: string;
  category: CategoryId;
  qty: number;
  unit: string; // "g", "kg", "L", "pcs", "" ...
  threshold: number; // en dessous (ou egal) de ce seuil : alerte stock bas
  alerted: boolean; // evite de re-notifier / re-ajouter a chaque rendu tant que le seuil reste franchi
  updatedAt: string;
  updatedBy: string | null;
  createdAt: string;
}

export const DEFAULT_GROUPS = [
  "Cuisine",
  "Menage",
  "Jardin",
  "Courses",
  "Animaux",
  "Ecole",
  "Administratif",
  "Entretien",
  "Personnalise",
];

export const STATUSES: TaskStatus[] = [
  "A faire",
  "En attente",
  "En cours",
  "A valider",
  "Terminee",
  "Refusee",
  "Annulee",
];
