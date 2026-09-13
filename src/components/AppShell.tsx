"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Chaque section porte son propre accent : injecte en variables CSS sur le conteneur,
// il se propage automatiquement aux boutons, titres, champs et cartes de la page.
export const SECTIONS = [
  { href: "/dashboard", label: "Tableau de bord", short: "Accueil", icon: "🏡", accent: "#d9603b", accent2: "#ec8b4a", soft: "#fbe9e0" },
  { href: "/tasks", label: "Taches", short: "Taches", icon: "✅", accent: "#3d6fb5", accent2: "#5b95d8", soft: "#e6eefa" },
  { href: "/meals", label: "Repas", short: "Repas", icon: "🍽️", accent: "#b5563d", accent2: "#d4795a", soft: "#fbeae4" },
  { href: "/shopping", label: "Courses", short: "Courses", icon: "🛒", accent: "#2e8b6a", accent2: "#4bb08a", soft: "#e2f2ec" },
  { href: "/stock", label: "Stock", short: "Stock", icon: "📦", accent: "#8a6d3b", accent2: "#b39055", soft: "#f6eeda" },
  { href: "/rewards", label: "Recompenses", short: "Points", icon: "🏆", accent: "#9c5aa8", accent2: "#bd7fc8", soft: "#f4e8f6" },
  { href: "/family", label: "Famille", short: "Famille", icon: "👨‍👩‍👧", accent: "#c07030", accent2: "#dc9450", soft: "#fbeedd" },
];

function sectionFor(pathname: string) {
  return SECTIONS.find((s) => pathname.startsWith(s.href)) ?? SECTIONS[0]!;
}

/** Initiales affichees dans la pastille de profil (une ou deux lettres). */
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { loading, user, familyId, members, activeMemberId, setActiveMemberId, signOut, family } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const section = sectionFor(pathname);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user || !familyId) {
    return (
      <main className="min-h-screen grid place-items-center layer">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl grid place-items-center text-2xl shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))" }}>
            🏡
          </div>
          <p className="text-sm text-ink-dim font-semibold">Chargement de FamilyFlow…</p>
        </div>
      </main>
    );
  }

  const active = members.find((m) => m.id === activeMemberId) ?? members[0] ?? null;
  const activeMembers = members.filter((m) => m.status === "active");

  return (
    <div
      className="layer min-h-screen"
      style={
        {
          "--section": section.accent,
          "--section-2": section.accent2,
          "--section-soft": section.soft,
        } as React.CSSProperties
      }
    >
      <header className="sticky top-0 z-30 border-b border-line" style={{ background: "color-mix(in srgb, var(--bg) 82%, transparent)", backdropFilter: "blur(14px) saturate(1.4)", WebkitBackdropFilter: "blur(14px) saturate(1.4)" }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between gap-3 h-16">
            <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-9 h-9 rounded-xl grid place-items-center text-lg shadow-sm shrink-0"
                style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))" }}
              >
                🏡
              </span>
              <span className="min-w-0">
                <span className="block font-extrabold text-[0.9375rem] leading-tight tracking-tight truncate">
                  {family?.name ?? "FamilyFlow"}
                </span>
                <span className="block text-[0.6875rem] text-ink-faint font-semibold leading-tight">FamilyFlow</span>
              </span>
            </Link>

            <div className="flex items-center gap-2 shrink-0">
              {active && (
                <div className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl border border-line bg-surface shadow-sm">
                  <span
                    className="avatar w-7 h-7 text-[0.6875rem]"
                    style={{ background: `linear-gradient(135deg, ${active.color || "var(--brand)"}, color-mix(in srgb, ${active.color || "var(--brand)"} 62%, #fff))` }}
                  >
                    {initials(active.name)}
                  </span>
                  <select
                    className="!w-auto !mb-0 !border-0 !bg-transparent !shadow-none !p-0 !pr-4 text-[0.8125rem] font-bold cursor-pointer focus:!ring-0"
                    value={active.id}
                    onChange={(e) => setActiveMemberId(e.target.value)}
                    aria-label="Profil actif"
                  >
                    {activeMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} · {m.points} pts
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button className="btn icon" onClick={() => signOut()} title="Se deconnecter" aria-label="Se deconnecter">
                ⏻
              </button>
            </div>
          </div>

          {/* Navigation complete sur ecran large ; la barre du bas prend le relais sur mobile. */}
          <nav className="hidden md:flex gap-1 pb-2.5 scroll-x" aria-label="Navigation principale">
            {SECTIONS.map((s) => {
              const isActive = pathname.startsWith(s.href);
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className="nav-pill"
                  data-active={isActive}
                  aria-current={isActive ? "page" : undefined}
                  style={isActive ? ({ "--section": s.accent, "--section-2": s.accent2 } as React.CSSProperties) : undefined}
                >
                  <span aria-hidden>{s.icon}</span>
                  {s.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-6 pb-28 md:pb-16">{children}</main>

      <nav className="tabbar md:hidden" aria-label="Navigation principale">
        {SECTIONS.map((s) => {
          const isActive = pathname.startsWith(s.href);
          return (
            <Link
              key={s.href}
              href={s.href}
              className="tabbar-item"
              data-active={isActive}
              aria-current={isActive ? "page" : undefined}
              style={isActive ? ({ "--section": s.accent } as React.CSSProperties) : undefined}
            >
              <span className="tab-icon" aria-hidden>
                {s.icon}
              </span>
              {s.short}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * En-tete de page : grand titre en degrade, sous-titre optionnel et zone d'actions.
 * Utilise sur toutes les pages pour garder un rythme visuel coherent.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap mb-6 animate-in">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="display text-gradient">{title}</h1>
        {subtitle && <p className="text-sm text-ink-dim mt-2 max-w-xl">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
}

/** Bloc vide illustre, pour ne jamais laisser une section totalement nue. */
export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="empty">
      <span className="empty-icon" aria-hidden>
        {icon}
      </span>
      <p className="font-bold text-ink-dim text-sm">{title}</p>
      {hint && <p className="text-xs mt-1">{hint}</p>}
    </div>
  );
}
