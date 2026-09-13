"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const TABS = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/tasks", label: "Taches" },
  { href: "/meals", label: "Repas" },
  { href: "/shopping", label: "Courses" },
  { href: "/stock", label: "Stock" },
  { href: "/rewards", label: "Recompenses" },
  { href: "/family", label: "Famille" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { loading, user, familyId, members, activeMemberId, setActiveMemberId, signOut, family } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user || !familyId) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm opacity-70">Chargement…</p>
      </main>
    );
  }

  const active = members.find((m) => m.id === activeMemberId) ?? members[0] ?? null;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-16">
      <div className="flex items-center justify-between gap-3 py-4 flex-wrap">
        <div className="flex items-center gap-2 font-extrabold text-lg">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center">🏠</span>
          <span>{family?.name ?? "FamilyFlow"}</span>
        </div>
        <div className="flex items-center gap-3">
          {active && (
            <select
              className="!w-auto !mb-0"
              value={active.id}
              onChange={(e) => setActiveMemberId(e.target.value)}
              title="Profil actif"
            >
              {members
                .filter((m) => m.status === "active")
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.points} pts)
                  </option>
                ))}
            </select>
          )}
          <button className="btn" onClick={() => signOut()}>
            Deconnexion
          </button>
        </div>
      </div>

      <nav className="flex gap-1 p-1 card !py-1 mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${
              pathname === t.href ? "bg-accent text-white" : "opacity-70 hover:opacity-100"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
