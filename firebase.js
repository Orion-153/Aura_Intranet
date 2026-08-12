/* ==========================================================================
   FIREBASE — Configuration
   ==========================================================================
   1. Va sur https://console.firebase.google.com
   2. Ouvre ton projet → icône ⚙️ "Paramètres du projet"
   3. Descends jusqu'à "Vos applications" → si tu n'as pas encore
      d'application Web, clique sur "</>" pour en créer une.
   4. Copie l'objet "firebaseConfig" qui s'affiche et remplace les
      valeurs ci-dessous.
   5. Dans la console Firebase, active aussi :
      - Authentication → Sign-in method → "E-mail/Mot de passe"
      - Firestore Database → Créer une base (mode production ou test)
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJET.firebaseapp.com",
  projectId: "VOTRE_PROJET",
  storageBucket: "VOTRE_PROJET.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID",
};

/** Devient vrai dès que tu as remplacé les valeurs ci-dessus par les tiennes. */
export const isFirebaseConfigured = firebaseConfig.apiKey !== "VOTRE_API_KEY";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);