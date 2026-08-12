/* ==========================================================================
   INTRANET — LOGIN / REGISTER
   Theme, bascule des formulaires, validation, et connexion via Firebase
   (pseudo Discord + mot de passe), plus configuration OAuth2 Discord.
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

// --- CONFIGURATION DISCORD ---
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

/* ==========================================================================
   1) THEME (clair / sombre) - persistance via localStorage
   ========================================================================== */

function initThemeToggle() {
  const STORAGE_KEY = "intranet-theme";
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) return;
  const root = document.documentElement;

  const applyTheme = (theme) => {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
  };

  const savedTheme = localStorage.getItem(STORAGE_KEY);

  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  }

  toggleBtn.addEventListener("click", () => {
    const isDark = root.getAttribute("data-theme") === "dark";
    const nextTheme = isDark ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
  });
}

/* ==========================================================================
   2) BASCULE Connexion / Inscription (liens en bas de carte)
   ========================================================================== */

function initPanelSwitching() {
  const panelLogin = document.getElementById("panel-login");
  const panelRegister = document.getElementById("panel-register");
  const title = document.getElementById("form-title");
  const subtitle = document.getElementById("form-subtitle");

  const switchToRegister = document.getElementById("switch-to-register");
  const switchToLogin = document.getElementById("switch-to-login");

  if (!panelLogin || !panelRegister) return;

  const copy = {
    login: {
      title: "Content de vous revoir",
      subtitle: "Connectez-vous avec votre pseudo Discord",
    },
    register: {
      title: "Creer votre compte",
      subtitle: "Rejoignez l'intranet avec votre pseudo Discord",
    },
  };

  function showPanel(target) {
    const isLogin = target === "login";

    panelLogin.classList.toggle("is-active", isLogin);
    panelRegister.classList.toggle("is-active", !isLogin);

    if (title) title.textContent = isLogin ? copy.login.title : copy.register.title;
    if (subtitle) subtitle.textContent = isLogin ? copy.login.subtitle : copy.register.subtitle;

    const firstInput = (isLogin ? panelLogin : panelRegister).querySelector("input");
    if (firstInput) firstInput.focus({ preventScroll: true });
  }

  if (switchToRegister) switchToRegister.addEventListener("click", () => showPanel("register"));
  if (switchToLogin) switchToLogin.addEventListener("click", () => showPanel("login"));
}

/* ==========================================================================
   3) AFFICHAGE / MASQUAGE DU MOT DE PASSE
   ========================================================================== */

function initPasswordVisibilityToggles() {
  document.querySelectorAll(".field__toggle-visibility").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (!input) return;
      const isHidden = input.type === "password";

      input.type = isHidden ? "text" : "password";
      btn.setAttribute("aria-label", isHidden ? "Masquer le mot de passe" : "Afficher le mot de passe");
    });
  });
}

/* ==========================================================================
   4) OUTILS DE VALIDATION
   ========================================================================== */

const DISCORD_USERNAME_REGEX = /^[a-z0-9._]{2,32}$/i;
const PSEUDO_EMAIL_DOMAIN = "pseudo.intranet.local";

function pseudoToTechnicalEmail(pseudo) {
  return `${pseudo.trim().toLowerCase()}@${PSEUDO_EMAIL_DOMAIN}`;
}

function setFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const field = input.closest(".field");
  if (!field) return;
  const errorEl = field.querySelector(`[data-error-for="${inputId}"]`);

  if (message) {
    field.classList.add("has-error");
    if (errorEl) errorEl.textContent = message;
  } else {
    field.classList.remove("has-error");
    if (errorEl) errorEl.textContent = "";
  }
}

function clearFieldErrors(...inputIds) {
  inputIds.forEach((id) => setFieldError(id, ""));
}

function setFormMessage(messageEl, text, type) {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.classList.remove("is-error", "is-success", "is-info", "is-visible");

  if (text) {
    messageEl.classList.add("is-visible", `is-${type}`);
  }
}

function translateFirebaseError(error) {
  const map = {
    "auth/email-already-in-use": "Ce pseudo est deja utilise.",
    "auth/invalid-email": "Ce pseudo n'est pas valide.",
    "auth/weak-password": "Le mot de passe doit contenir au moins 8 caracteres.",
    "auth/user-not-found": "Aucun compte ne correspond a ce pseudo.",
    "auth/wrong-password": "Mot de passe incorrect.",
    "auth/invalid-credential": "Pseudo ou mot de passe incorrect.",
    "auth/too-many-requests": "Trop de tentatives. Reessayez dans quelques minutes.",
  };
  return map[error.code] || "Une erreur est survenue. Merci de reessayer.";
}

function ensureFirebaseReady(messageEl) {
  if (!isFirebaseConfigured) {
    setFormMessage(
      messageEl,
      "Firebase n'est pas encore configure (voir firebase.js).",
      "info"
    );
    return false;
  }
  return true;
}

/* ==========================================================================
   5) FORMULAIRE DE CONNEXION
   ========================================================================== */

function initLoginForm() {
  const form = document.getElementById("panel-login");
  if (!form) return;
  const identifierInput = document.getElementById("login-identifier");
  const passwordInput = document.getElementById("login-password");
  const rememberInput = document.getElementById("remember-me");
  const message = document.getElementById("login-message");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors("login-identifier", "login-password");
    setFormMessage(message, "", null);

    let hasError = false;

    if (!DISCORD_USERNAME_REGEX.test(identifierInput.value.trim())) {
      setFieldError("login-identifier", "Veuillez saisir un pseudo Discord valide.");
      hasError = true;
    }

    if (passwordInput.value.length === 0) {
      setFieldError("login-password", "Veuillez saisir votre mot de passe.");
      hasError = true;
    }

    if (hasError) {
      setFormMessage(message, "Merci de corriger les champs indiques ci-dessus.", "error");
      return;
    }

    if (!ensureFirebaseReady(message)) return;

    if (submitBtn) submitBtn.disabled = true;

    try {
      await setPersistence(
        auth,
        rememberInput && rememberInput.checked ? browserLocalPersistence : browserSessionPersistence
      );

      await signInWithEmailAndPassword(
        auth,
        pseudoToTechnicalEmail(identifierInput.value),
        passwordInput.value
      );

      setFormMessage(message, "Connexion reussie - redirection...", "success");
      window.location.href = "dashboard.html";
    } catch (error) {
      setFormMessage(message, translateFirebaseError(error), "error");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

/* ==========================================================================
   6) FORMULAIRE D'INSCRIPTION
   ========================================================================== */

function initRegisterForm() {
  const form = document.getElementById("panel-register");
  if (!form) return;
  const usernameInput = document.getElementById("register-username");
  const passwordInput = document.getElementById("register-password");
  const confirmInput = document.getElementById("register-confirm");
  const message = document.getElementById("register-message");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors("register-username", "register-password", "register-confirm");
    setFormMessage(message, "", null);

    let hasError = false;

    if (!DISCORD_USERNAME_REGEX.test(usernameInput.value.trim())) {
      setFieldError(
        "register-username",
        "2 a 32 caracteres : lettres, chiffres, points ou underscores."
      );
      hasError = true;
    }

    if (passwordInput.value.length < 8) {
      setFieldError("register-password", "Le mot de passe doit contenir au moins 8 caracteres.");
      hasError = true;
    }

    if (confirmInput.value.length === 0) {
      setFieldError("register-confirm", "Veuillez confirmer votre mot de passe.");
      hasError = true;
    } else if (confirmInput.value !== passwordInput.value) {
      setFieldError("register-confirm", "Les mots de passe ne correspondent pas.");
      hasError = true;
    }

    if (hasError) {
      setFormMessage(message, "Merci de corriger les champs indiques ci-dessus.", "error");
      return;
    }

    if (!ensureFirebaseReady(message)) return;

    if (submitBtn) submitBtn.disabled = true;

    try {
      const pseudo = usernameInput.value.trim();

      const credential = await createUserWithEmailAndPassword(
        auth,
        pseudoToTechnicalEmail(pseudo),
        passwordInput.value
      );

      await updateProfile(credential.user, { displayName: pseudo });

      await setDoc(doc(db, "users", credential.user.uid), {
        pseudo,
        createdAt: serverTimestamp(),
        discordId: null,
      });

      setFormMessage(message, "Compte cree avec succes - redirection...", "success");
      window.location.href = "dashboard.html";
    } catch (error) {
      setFormMessage(message, translateFirebaseError(error), "error");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

/* ==========================================================================
   7) MOT DE PASSE OUBLIE
   ========================================================================== */

function initForgotPassword() {
  const link = document.getElementById("forgot-password");
  const message = document.getElementById("login-message");

  if (!link) return;

  link.addEventListener("click", (event) => {
    event.preventDefault();
    setFormMessage(
      message,
      "La recuperation de mot de passe necessite un e-mail associe au compte : page non creee pour l'instant.",
      "info"
    );
  });
}

/* ==========================================================================
   8) CONNEXION DISCORD (OAuth2)
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
      window.location.href = buildDiscordAuthUrl(DISCORD_OAUTH_CONFIG);
    });
  });
}
