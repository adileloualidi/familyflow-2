import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Firebase Storage n'est pas utilise dans cette v1 : Google exige desormais le
// forfait payant "Blaze" pour creer un bucket Storage, meme pour un usage minime.
// La fonctionnalite "preuve photo" est donc desactivee pour rester 100% gratuit.
// Pour la reactiver plus tard : `import { getStorage } from "firebase/storage";`
// et decommenter `export const storage` ci-dessous, une fois le forfait passe.

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function assertConfigured() {
  const missing = Object.entries(firebaseConfig).filter(([, v]) => !v);
  if (missing.length > 0) {
    // Ne jette pas d'erreur au build (SSR) : seulement un avertissement clair au runtime client.
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.error(
        "[FamilyFlow] Configuration Firebase incomplete. Copie .env.local.example en .env.local et renseigne tes cles Firebase.",
        missing.map(([k]) => k)
      );
    }
  }
}
assertConfigured();

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
