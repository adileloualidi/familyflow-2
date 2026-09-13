"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FirebaseError } from "firebase/app";

const HIGHLIGHTS = [
  { icon: "✅", title: "Les taches", text: "Reparties, suivies, validees — et recompensees en points." },
  { icon: "🍽️", title: "Les repas", text: "Planifie la semaine, les ingredients filent dans les courses." },
  { icon: "📦", title: "Le stock", text: "Dis simplement ce qui manque, l'assistant met tout a jour." },
];

export default function LoginPage() {
  const { signIn, signUpWithFamily } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function friendlyError(e: unknown): string {
    if (e instanceof FirebaseError) {
      switch (e.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          return "Email ou mot de passe incorrect.";
        case "auth/email-already-in-use":
          return "Un compte existe deja avec cet email.";
        case "auth/weak-password":
          return "Le mot de passe doit contenir au moins 6 caracteres.";
        case "auth/invalid-api-key":
        case "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
          return "Configuration Firebase manquante ou invalide.";
        default:
          return "Erreur : " + e.message;
      }
    }
    return "Une erreur est survenue.";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        if (!familyName.trim() || !adminName.trim()) {
          setError("Merci de renseigner le nom de la famille et ton nom.");
          setBusy(false);
          return;
        }
        await signUpWithFamily(email, password, familyName.trim(), adminName.trim());
      }
      router.replace("/dashboard");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="layer min-h-screen grid lg:grid-cols-2">
      {/* Colonne de presentation, masquee sur mobile pour aller droit au formulaire */}
      <section className="hidden lg:flex flex-col justify-center px-14 xl:px-20 gap-9">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-2xl grid place-items-center text-2xl shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))" }}>
            🏡
          </span>
          <span className="text-xl font-extrabold tracking-tight">FamilyFlow</span>
        </div>

        <div>
          <h1 className="display text-gradient max-w-lg">Toute la maison, au meme endroit.</h1>
          <p className="text-ink-dim mt-4 max-w-md leading-relaxed">
            Les taches, les repas, les courses et le stock de la famille — organises ensemble, sans post-it sur le frigo.
          </p>
        </div>

        <div className="flex flex-col gap-4 max-w-md">
          {HIGHLIGHTS.map((h) => (
            <div key={h.title} className="flex items-start gap-3.5">
              <span className="w-10 h-10 rounded-xl grid place-items-center text-lg shrink-0 shadow-sm" style={{ background: "var(--surface)" }} aria-hidden>
                {h.icon}
              </span>
              <div>
                <p className="font-bold text-sm">{h.title}</p>
                <p className="text-[0.8125rem] text-ink-dim mt-0.5">{h.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Formulaire */}
      <section className="flex items-center justify-center p-5 sm:p-8">
        <form onSubmit={handleSubmit} className="card card-lg w-full max-w-sm shadow-lg animate-in">
          <div className="lg:hidden flex items-center gap-2.5 mb-5">
            <span className="w-10 h-10 rounded-xl grid place-items-center text-xl shadow-sm" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))" }}>
              🏡
            </span>
            <span className="font-extrabold text-lg tracking-tight">FamilyFlow</span>
          </div>

          <h2 className="title-lg">{mode === "signin" ? "Content de te revoir" : "Creons ton espace"}</h2>
          <p className="text-sm text-ink-dim mt-1.5 mb-6">
            {mode === "signin" ? "Connecte-toi a ton espace familial." : "Tu en seras l'administrateur, et pourras inviter les autres ensuite."}
          </p>

          {mode === "signup" && (
            <>
              <label className="field-label" htmlFor="family">
                Nom de la famille
              </label>
              <input id="family" type="text" value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="Famille El Oualidi" />
              <label className="field-label" htmlFor="admin">
                Ton prenom
              </label>
              <input id="admin" type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Adil" />
            </>
          )}

          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com" autoComplete="email" />

          <label className="field-label" htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Au moins 6 caracteres"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />

          {error && (
            <div className="flex items-start gap-2 text-sm p-3 rounded-xl mb-3" style={{ background: "var(--danger-soft)", color: "var(--danger)" }} role="alert">
              <span aria-hidden>✕</span>
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <button className="btn primary w-full !py-3" type="submit" disabled={busy}>
            {busy ? "Un instant…" : mode === "signin" ? "Se connecter" : "Creer mon espace"}
          </button>

          <button
            type="button"
            className="btn ghost w-full mt-2"
            onClick={() => {
              setError(null);
              setMode(mode === "signin" ? "signup" : "signin");
            }}
          >
            {mode === "signin" ? "Pas encore de compte ? En creer un" : "Deja un compte ? Se connecter"}
          </button>
        </form>
      </section>
    </main>
  );
}
