import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDduIgGCk2aBsECoeZh9mKyv0K3I_TkV_g",
  authDomain: "application-task-home.firebaseapp.com",
  projectId: "application-task-home",
  storageBucket: "application-task-home.firebasestorage.app",
  messagingSenderId: "848060102397",
  appId: "1:848060102397:web:7fa6e08d10b905b51a3094",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
