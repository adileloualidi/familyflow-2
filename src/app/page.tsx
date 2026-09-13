"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { loading, user, familyId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (familyId) router.replace("/dashboard");
  }, [loading, user, familyId, router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-sm opacity-70">Chargement de FamilyFlow…</p>
    </main>
  );
}
