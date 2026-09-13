"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FirebaseError } from "firebase/app";

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
          return "Configuration Firebase manquante ou invalide. Verifie ton fichier .env.local.";
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
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm">
        <h1 className="text-xl font-extrabold mb-1">FamilyFlow</h1>
        <p className="text-sm opacity-70 mb-4">
          {mode === "signin" ? "Connecte-toi a ton espace familial." : "Cree ton espace familial (tu seras administrateur)."}
        </p>

        {mode === "signup" && (
          <>
            <label className="text-xs font-bold opacity-70">Nom de la famille</label>
            <input type="text" value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="Famille Eloualidi" />
            <label className="text-xs font-bold opacity-70">Ton nom</label>
            <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Adil" />
          </>
        )}

        <label className="text-xs font-bold opacity-70">Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@example.com" />
        <label className="text-xs font-bold opacity-70">Mot de passe</label>
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="******" />

        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

        <button className="btn primary w-full" type="submit" disabled={busy}>
          {busy ? "…" : mode === "signin" ? "Se connecter" : "Creer mon espace"}
        </button>

        <button
          type="button"
          className="btn w-full mt-2"
          onClick={() => {
            setError(null);
            setMode(mode === "signin" ? "signup" : "signin");
          }}
        >
          {mode === "signin" ? "Pas encore de compte ? Creer un espace familial" : "Deja un compte ? Se connecter"}
        </button>
      </form>
    </main>
  );
}
