/* ==========================================================================
   FIREBASE — Configuration
   ==========================================================================
   Ce fichier initialise Firebase pour le projet "intranet-cd0ba".

   Si tu veux changer de projet Firebase un jour, il suffit de remplacer
   les valeurs de firebaseConfig ci-dessous par celles du nouveau projet
   (Paramètres du projet → Vos applications → Config).
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAV7H3xoQTEFOLQhg_t1hqjEOas7zkJ37k",
  authDomain: "intranet-cd0ba.firebaseapp.com",
  projectId: "intranet-cd0ba",
  storageBucket: "intranet-cd0ba.firebasestorage.app",
  messagingSenderId: "781261792995",
  appId: "1:781261792995:web:36ea61ea91b06aafc9c7d6",
  measurementId: "G-YMHQ31EFSD",
};

/** Devient vrai dès que la config n'utilise plus les valeurs par défaut. */
export const isFirebaseConfigured = firebaseConfig.apiKey !== "VOTRE_API_KEY";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);