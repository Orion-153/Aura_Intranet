/* ==========================================================================
   INTRANET — LOGIN / REGISTER
   ========================================================================== */

import { auth, db, isFirebaseConfigured } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// --- CONFIGURATION DISCORD MODIFIÉE ---
const DISCORD_OAUTH_CONFIG = {
  clientId: "1522661512412659772",
  redirectUri: "https://orion-153.github.io/Aura_Intranet/dashboard.html",
  scope: ["identify"],
  endpoint: "https://discord.com/oauth2/authorize",
};

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initPanelSwitching();
  initPasswordVisibilityToggles();
  initLoginForm();
  initRegisterForm();
  initForgotPassword();
  initDiscordLogin();
});

// ... (Garde tes fonctions initThemeToggle, initPanelSwitching, initPasswordVisibilityToggles, initLoginForm telles quelles) ...

/* ==========================================================================
   6) FORMULAIRE D'INSCRIPTION (Corrigé)
   ========================================================================== */
function initRegisterForm() {
  const form = document.getElementById("panel-register");
  const usernameInput = document.getElementById("register-username");
  const passwordInput = document.getElementById("register-password");
  const confirmInput = document.getElementById("register-confirm");
  const message = document.getElementById("register-message");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors("register-username", "register-password", "register-confirm");
    setFormMessage(message, "", null);

    // ... (Logique de validation inchangée) ...

    submitBtn.disabled = true;

    try {
      const pseudo = usernameInput.value.trim();
      const credential = await createUserWithEmailAndPassword(
        auth,
        pseudoToTechnicalEmail(pseudo),
        passwordInput.value
      );

      await updateProfile(credential.user, { displayName: pseudo });

      // On s'assure de créer le document Firestore pour cet utilisateur
      await setDoc(doc(db, "users", credential.user.uid), {
        pseudo,
        createdAt: serverTimestamp(),
        discordId: null, // Initialisation à null
      });

      // Redirection après succès
      window.location.href = "dashboard.html";
    } catch (error) {
      setFormMessage(message, translateFirebaseError(error), "error");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/* ==========================================================================
   8) CONNEXION DISCORD (Activée)
   ========================================================================== */
function buildDiscordAuthUrl(config) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scope.join(" "),
  });
  return `${config.endpoint}?${params.toString()}`;
}

function initDiscordLogin() {
  const buttons = document.querySelectorAll("[data-discord-trigger]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Redirection directe vers Discord
      window.location.href = buildDiscordAuthUrl(DISCORD_OAUTH_CONFIG);
    });
  });
}

// --- AJOUTER ICI TES AUTRES FONCTIONS (initLoginForm, initThemeToggle, etc.) SANS CHANGEMENT ---
