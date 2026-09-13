"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  createFamilyWithAdmin,
  getUserFamilyLink,
  subscribeFamily,
  subscribeMembers,
  subscribeTasks,
  subscribeRewards,
  subscribeRedemptions,
  subscribeMeals,
  subscribeShopping,
  subscribeInventory,
} from "@/lib/firestore-helpers";
import type { Family, Member, Task, Reward, Redemption, Meal, ShoppingItem, InventoryItem } from "@/types";

interface AuthState {
  loading: boolean;
  user: User | null;
  familyId: string | null;
  myMemberId: string | null;
  activeMemberId: string | null; // profil actif (kiosque familial) — peut differer de myMemberId si l'admin bascule sur un profil enfant
  setActiveMemberId: (id: string) => void;
  family: Family | null;
  members: Member[];
  tasks: Task[];
  rewards: Reward[];
  redemptions: Redemption[];
  meals: Meal[];
  shopping: ShoppingItem[];
  inventory: InventoryItem[];
  signIn: (email: string, password: string) => Promise<void>;
  signUpWithFamily: (email: string, password: string, familyName: string, adminName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [activeMemberId, setActiveMemberIdState] = useState<string | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setFamilyId(null);
        setMyMemberId(null);
        setActiveMemberIdState(null);
        setLoading(false);
        return;
      }
      const link = await getUserFamilyLink(u.uid);
      if (link) {
        setFamilyId(link.familyId);
        setMyMemberId(link.memberId);
        try {
          const stored = localStorage.getItem("ff_active_member_" + link.familyId);
          setActiveMemberIdState(stored || link.memberId);
        } catch {
          setActiveMemberIdState(link.memberId);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!familyId) return;
    const unsubs = [
      subscribeFamily(familyId, setFamily),
      subscribeMembers(familyId, setMembers),
      subscribeTasks(familyId, setTasks),
      subscribeRewards(familyId, setRewards),
      subscribeRedemptions(familyId, setRedemptions),
      subscribeMeals(familyId, setMeals),
      subscribeShopping(familyId, setShopping),
      subscribeInventory(familyId, setInventory),
    ];
    return () => unsubs.forEach((u) => u());
  }, [familyId]);

  const setActiveMemberId = (id: string) => {
    setActiveMemberIdState(id);
    if (familyId) {
      try {
        localStorage.setItem("ff_active_member_" + familyId, id);
      } catch {
        /* stockage local indisponible — ignore */
      }
    }
  };

  const value = useMemo<AuthState>(
    () => ({
      loading,
      user,
      familyId,
      myMemberId,
      activeMemberId,
      setActiveMemberId,
      family,
      members,
      tasks,
      rewards,
      redemptions,
      meals,
      shopping,
      inventory,
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      signUpWithFamily: async (email, password, familyName, adminName) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const { familyId: fid, memberId } = await createFamilyWithAdmin({
          uid: cred.user.uid,
          familyName,
          adminName,
        });
        setFamilyId(fid);
        setMyMemberId(memberId);
        setActiveMemberId(memberId);
      },
      signOut: async () => {
        await fbSignOut(auth);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, user, familyId, myMemberId, activeMemberId, family, members, tasks, rewards, redemptions, meals, shopping, inventory]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit etre utilise a l'interieur de <AuthProvider>");
  return ctx;
}
