import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { computeStreak, newlyEarnedBadges, todayStr } from "./family";
import { guessCategory } from "./categories";
import {
  DEFAULT_GROUPS,
  type Family,
  type Member,
  type Reward,
  type Redemption,
  type Task,
  type TaskStatus,
  type Meal,
  type MealIngredient,
  type ShoppingItem,
  type InventoryItem,
  type CategoryId,
} from "@/types";

/* ---------- paths ---------- */
const familyDoc = (familyId: string) => doc(db, "families", familyId);
const membersCol = (familyId: string) => collection(db, "families", familyId, "members");
const memberDoc = (familyId: string, id: string) => doc(db, "families", familyId, "members", id);
const tasksCol = (familyId: string) => collection(db, "families", familyId, "tasks");
const taskDoc = (familyId: string, id: string) => doc(db, "families", familyId, "tasks", id);
const rewardsCol = (familyId: string) => collection(db, "families", familyId, "rewards");
const redemptionsCol = (familyId: string) => collection(db, "families", familyId, "redemptions");
const userDoc = (uid: string) => doc(db, "users", uid);
const mealsCol = (familyId: string) => collection(db, "families", familyId, "meals");
const mealDoc = (familyId: string, id: string) => doc(db, "families", familyId, "meals", id);
const shoppingCol = (familyId: string) => collection(db, "families", familyId, "shopping");
const shoppingDoc = (familyId: string, id: string) => doc(db, "families", familyId, "shopping", id);
const inventoryCol = (familyId: string) => collection(db, "families", familyId, "inventory");
const inventoryDoc = (familyId: string, id: string) => doc(db, "families", familyId, "inventory", id);

/* ---------- family bootstrap ---------- */
export async function createFamilyWithAdmin(opts: { uid: string; familyName: string; adminName: string }) {
  const familyRef = doc(collection(db, "families"));
  const family: Omit<Family, "id"> = {
    name: opts.familyName,
    groups: DEFAULT_GROUPS,
    createdAt: new Date().toISOString(),
    ownerUid: opts.uid,
  };
  await setDoc(familyRef, family);

  const memberRef = doc(membersCol(familyRef.id));
  const member: Omit<Member, "id"> = {
    familyId: familyRef.id,
    uid: opts.uid,
    name: opts.adminName,
    role: "admin",
    age: null,
    color: "#e0703a",
    avatarUrl: null,
    status: "active",
    skills: [],
    preferences: [],
    availability: [],
    canCreateTasks: true,
    points: 0,
    totalPointsEarned: 0,
    tasksDone: 0,
    streak: 0,
    lastDoneDate: null,
    badges: [],
    createdAt: new Date().toISOString(),
  };
    await setDoc(userDoc(opts.uid), { familyId: familyRef.id, memberId: memberRef.id });
  await setDoc(memberRef, member);
  return { familyId: familyRef.id, memberId: memberRef.id };
}

export async function getUserFamilyLink(uid: string) {
  const snap = await getDoc(userDoc(uid));
  if (!snap.exists()) return null;
  return snap.data() as { familyId: string; memberId: string };
}

export function subscribeFamily(familyId: string, cb: (f: Family | null) => void): Unsubscribe {
  return onSnapshot(familyDoc(familyId), (snap) => {
    cb(snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Family, "id">) }) : null);
  });
}

/* ---------- members ---------- */
export function subscribeMembers(familyId: string, cb: (members: Member[]) => void): Unsubscribe {
  return onSnapshot(query(membersCol(familyId), orderBy("createdAt", "asc")), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Member, "id">) })));
  });
}

export async function createMember(familyId: string, data: Partial<Member> & { name: string; role: Member["role"] }) {
  const ref = doc(membersCol(familyId));
  const member: Omit<Member, "id"> = {
    familyId,
    uid: data.uid ?? null,
    name: data.name,
    role: data.role,
    age: data.age ?? null,
    color: data.color ?? "#3a8f7a",
    avatarUrl: data.avatarUrl ?? null,
    status: "active",
    skills: data.skills ?? [],
    preferences: data.preferences ?? [],
    availability: data.availability ?? [],
    canCreateTasks: data.role === "admin" ? true : !!data.canCreateTasks,
    points: 0,
    totalPointsEarned: 0,
    tasksDone: 0,
    streak: 0,
    lastDoneDate: null,
    badges: [],
    createdAt: new Date().toISOString(),
  };
  await setDoc(ref, member);
  return ref.id;
}

export async function updateMember(familyId: string, id: string, patch: Partial<Member>) {
  await updateDoc(memberDoc(familyId, id), patch as Record<string, unknown>);
}

export async function deleteMember(familyId: string, id: string) {
  await deleteDoc(memberDoc(familyId, id));
}

/* ---------- tasks ---------- */
export function subscribeTasks(familyId: string, cb: (tasks: Task[]) => void): Unsubscribe {
  return onSnapshot(query(tasksCol(familyId), orderBy("createdAt", "desc")), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Task, "id">) })));
  });
}

export async function createTask(familyId: string, data: Partial<Task> & { title: string }, createdBy: string | null) {
  const ref = doc(tasksCol(familyId));
  const task: Omit<Task, "id"> = {
    familyId,
    title: data.title,
    description: data.description ?? "",
    group: data.group ?? "Personnalise",
    type: data.type ?? "simple",
    status: "A faire",
    points: data.points ?? 5,
    difficulty: data.difficulty ?? "facile",
    estimatedMinutes: data.estimatedMinutes ?? 10,
    assigneeId: data.assigneeId ?? null,
    assignedMode: data.assignedMode ?? "manuel",
    dueDate: data.dueDate ?? null,
    recurrence: data.recurrence ?? null,
    minAge: data.minAge ?? null,
    subtasks: data.subtasks ?? [],
    comments: [],
    proofUrls: [],
    createdBy,
    createdAt: new Date().toISOString(),
    completedAt: null,
    history: [{ status: "A faire", at: new Date().toISOString(), by: createdBy }],
  };
  await setDoc(ref, task);
  return ref.id;
}

export async function updateTask(familyId: string, id: string, patch: Partial<Task>) {
  await updateDoc(taskDoc(familyId, id), patch as Record<string, unknown>);
}

export async function deleteTask(familyId: string, id: string) {
  await deleteDoc(taskDoc(familyId, id));
}

/** Change le statut d'une tache, journalise l'historique, et attribue les points/badges si elle passe a "Terminee". */
export async function setTaskStatus(familyId: string, task: Task, status: TaskStatus, by: string | null) {
  const history = [...task.history, { status, at: new Date().toISOString(), by }];
  const patch: Partial<Task> = { status, history };
  if (status === "Terminee") {
    patch.completedAt = new Date().toISOString();
  }
  await updateTask(familyId, task.id, patch);

  if (status === "Terminee" && task.assigneeId) {
    await awardCompletion(familyId, task);
  }
}

async function awardCompletion(familyId: string, task: Task) {
  const memberSnap = await getDoc(memberDoc(familyId, task.assigneeId as string));
  if (!memberSnap.exists()) return;
  const member = { id: memberSnap.id, ...(memberSnap.data() as Omit<Member, "id">) };
  const today = todayStr();
  const streak = computeStreak(member, today);
  const after = {
    points: (member.points || 0) + (task.points || 0),
    totalPointsEarned: (member.totalPointsEarned || 0) + (task.points || 0),
    tasksDone: (member.tasksDone || 0) + 1,
    streak,
    lastDoneDate: today,
  };
  const earned = newlyEarnedBadges(member, after);
  await updateMember(familyId, member.id, {
    ...after,
    badges: earned.length ? [...member.badges, ...earned] : member.badges,
  });
}

/* ---------- rewards ---------- */
export function subscribeRewards(familyId: string, cb: (rewards: Reward[]) => void): Unsubscribe {
  return onSnapshot(rewardsCol(familyId), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Reward, "id">) })));
  });
}
export async function createReward(familyId: string, data: { title: string; cost: number; category: string }) {
  await addDoc(rewardsCol(familyId), { familyId, ...data, createdAt: new Date().toISOString() });
}
export async function deleteReward(familyId: string, id: string) {
  await deleteDoc(doc(rewardsCol(familyId), id));
}

export function subscribeRedemptions(familyId: string, cb: (r: Redemption[]) => void): Unsubscribe {
  return onSnapshot(query(redemptionsCol(familyId), orderBy("at", "desc")), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Redemption, "id">) })));
  });
}
export async function redeemReward(familyId: string, member: Member, reward: Reward) {
  if ((member.points || 0) < reward.cost) throw new Error("Points insuffisants");
  await updateMember(familyId, member.id, { points: member.points - reward.cost });
  await addDoc(redemptionsCol(familyId), {
    familyId,
    memberId: member.id,
    rewardId: reward.id,
    rewardTitle: reward.title,
    cost: reward.cost,
    status: "en attente",
    at: new Date().toISOString(),
  } satisfies Omit<Redemption, "id">);
}
export async function setRedemptionStatus(familyId: string, id: string, status: Redemption["status"]) {
  await updateDoc(doc(redemptionsCol(familyId), id), { status });
}

/* ---------- meals (planning des repas) ---------- */
export function subscribeMeals(familyId: string, cb: (meals: Meal[]) => void): Unsubscribe {
  return onSnapshot(query(mealsCol(familyId), orderBy("date", "asc")), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Meal, "id">) })));
  });
}

/**
 * Cree ou met a jour un repas, puis synchronise la liste de courses :
 * les articles precedemment ajoutes pour ce repas (fromMealId === meal.id) et dont
 * l'ingredient a disparu sont supprimes (sauf s'ils sont deja coches / dans le caddie
 * ou deja possedes en stock suffisant), les nouveaux ingredients sont ajoutes.
 */
export async function saveMeal(
  familyId: string,
  data: { date: string; slot: Meal["slot"]; title: string; ingredients: MealIngredient[] },
  createdBy: string | null,
  existing?: Meal
) {
  let mealId: string;
  if (existing) {
    mealId = existing.id;
    await updateDoc(mealDoc(familyId, existing.id), {
      date: data.date,
      slot: data.slot,
      title: data.title,
      ingredients: data.ingredients,
    });
  } else {
    const ref = doc(mealsCol(familyId));
    mealId = ref.id;
    const meal: Omit<Meal, "id"> = {
      familyId,
      date: data.date,
      slot: data.slot,
      title: data.title,
      ingredients: data.ingredients,
      createdBy,
      createdAt: new Date().toISOString(),
    };
    await setDoc(ref, meal);
  }
  await syncMealShopping(familyId, mealId, data.ingredients, createdBy);
  return mealId;
}

export async function syncMealShopping(
  familyId: string,
  mealId: string,
  ingredients: MealIngredient[],
  addedBy: string | null
) {
  const existingSnap = await getDocs(query(shoppingCol(familyId), where("fromMealId", "==", mealId)));
  const existingItems = existingSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ShoppingItem, "id">) }));

  const wantedNames = new Set(ingredients.map((i) => i.name.trim().toLowerCase()).filter(Boolean));

  // supprime les articles dont l'ingredient a ete retire du repas (non coches uniquement)
  for (const item of existingItems) {
    if (!wantedNames.has(item.name.trim().toLowerCase()) && !item.done) {
      await deleteDoc(shoppingDoc(familyId, item.id));
    }
  }

  const existingNames = new Set(
    existingItems.filter((i) => wantedNames.has(i.name.trim().toLowerCase())).map((i) => i.name.trim().toLowerCase())
  );

  for (const ing of ingredients) {
    const name = ing.name.trim();
    if (!name || existingNames.has(name.toLowerCase())) continue;
    const qty = [ing.qty, ing.unit].filter(Boolean).join(" ").trim();
    await addShoppingItem(familyId, { name, qty, fromMealId: mealId, addedBy });
  }
}

export async function deleteMeal(familyId: string, meal: Meal) {
  await deleteDoc(mealDoc(familyId, meal.id));
  const snap = await getDocs(query(shoppingCol(familyId), where("fromMealId", "==", meal.id)));
  for (const d of snap.docs) {
    if (!(d.data() as ShoppingItem).done) await deleteDoc(d.ref);
  }
}

/* ---------- liste de courses ---------- */
export function subscribeShopping(familyId: string, cb: (items: ShoppingItem[]) => void): Unsubscribe {
  return onSnapshot(query(shoppingCol(familyId), orderBy("createdAt", "asc")), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ShoppingItem, "id">) })));
  });
}

export async function addShoppingItem(
  familyId: string,
  data: {
    name: string;
    qty?: string;
    category?: CategoryId;
    fromMealId?: string | null;
    fromInventoryId?: string | null;
    addedBy?: string | null;
  }
) {
  const ref = doc(shoppingCol(familyId));
  const item: Omit<ShoppingItem, "id"> = {
    familyId,
    name: data.name,
    qty: data.qty ?? "",
    category: data.category ?? guessCategory(data.name),
    done: false,
    fromMealId: data.fromMealId ?? null,
    fromInventoryId: data.fromInventoryId ?? null,
    addedBy: data.addedBy ?? null,
    createdAt: new Date().toISOString(),
  };
  await setDoc(ref, item);
  return ref.id;
}

export async function toggleShoppingItem(familyId: string, id: string, done: boolean) {
  await updateDoc(shoppingDoc(familyId, id), { done });
}

export async function setShoppingCategory(familyId: string, id: string, category: CategoryId) {
  await updateDoc(shoppingDoc(familyId, id), { category });
}

export async function deleteShoppingItem(familyId: string, id: string) {
  await deleteDoc(shoppingDoc(familyId, id));
}

/* ---------- inventaire / stock (alertes seuil bas) ---------- */
export function subscribeInventory(familyId: string, cb: (items: InventoryItem[]) => void): Unsubscribe {
  return onSnapshot(query(inventoryCol(familyId), orderBy("name", "asc")), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<InventoryItem, "id">) })));
  });
}

export async function createInventoryItem(
  familyId: string,
  data: { name: string; category?: CategoryId; qty: number; unit?: string; threshold: number },
  by: string | null
) {
  const ref = doc(inventoryCol(familyId));
  const item: Omit<InventoryItem, "id"> = {
    familyId,
    name: data.name,
    category: data.category ?? guessCategory(data.name),
    qty: data.qty,
    unit: data.unit ?? "",
    threshold: data.threshold,
    alerted: false,
    updatedAt: new Date().toISOString(),
    updatedBy: by,
    createdAt: new Date().toISOString(),
  };
  await setDoc(ref, item);
  await checkInventoryThreshold(familyId, { id: ref.id, ...item }, by);
  return ref.id;
}

/**
 * Met a jour la quantite d'un article de stock et gere automatiquement le
 * franchissement de seuil : sous le seuil -> ajoute (une seule fois, via
 * `alerted`) un article dans la liste de courses ; repasse au-dessus -> reinitialise
 * l'indicateur pour permettre une future alerte.
 */
export async function updateInventoryQty(familyId: string, item: InventoryItem, newQty: number, by: string | null) {
  await updateDoc(inventoryDoc(familyId, item.id), {
    qty: newQty,
    updatedAt: new Date().toISOString(),
    updatedBy: by,
  });
  await checkInventoryThreshold(familyId, { ...item, qty: newQty }, by);
}

export async function updateInventoryItem(familyId: string, id: string, patch: Partial<InventoryItem>) {
  await updateDoc(inventoryDoc(familyId, id), { ...patch, updatedAt: new Date().toISOString() } as Record<string, unknown>);
}

export async function deleteInventoryItem(familyId: string, id: string) {
  await deleteDoc(inventoryDoc(familyId, id));
}

async function checkInventoryThreshold(familyId: string, item: InventoryItem, by: string | null) {
  const low = item.qty <= item.threshold;
  if (low && !item.alerted) {
    await updateDoc(inventoryDoc(familyId, item.id), { alerted: true });
    const already = await getDocs(query(shoppingCol(familyId), where("fromInventoryId", "==", item.id)));
    const stillPending = already.docs.some((d) => !(d.data() as ShoppingItem).done);
    if (!stillPending) {
      await addShoppingItem(familyId, {
        name: item.name,
        category: item.category,
        fromInventoryId: item.id,
        addedBy: by,
      });
    }
  } else if (!low && item.alerted) {
    await updateDoc(inventoryDoc(familyId, item.id), { alerted: false });
  }
}

/* ---------- proof photo upload ----------
   Desactive dans cette v1 : Firebase Storage exige le forfait payant "Blaze".
   Le champ Task.proofUrls reste dans le modele de donnees pour une reactivation
   facile plus tard (voir README, section "Limites connues"). */
