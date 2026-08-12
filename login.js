/* ==========================================================================
   INTRANET — LOGIN / REGISTER
   Theme, bascule des formulaires, validation, et connexion via Firebase
   (pseudo Discord + mot de passe), plus preparation de l'OAuth2 Discord.
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

    title.textContent = isLogin ? copy.login.title : copy.register.title;
    subtitle.textContent = isLogin ? copy.login.subtitle : copy.register.subtitle;

    const firstInput = (isLogin ? panelLogin : panelRegister).querySelector("input");
    if (firstInput) firstInput.focus({ preventScroll: true });
  }

  switchToRegister.addEventListener("click", () => showPanel("register"));
  switchToLogin.addEventListener("click", () => showPanel("login"));
}

/* ==========================================================================
   3) AFFICHAGE / MASQUAGE DU MOT DE PASSE
   ========================================================================== */

function initPasswordVisibilityToggles() {
  document.querySelectorAll(".field__toggle-visibility").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
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
  const field = input.closest(".field");
  const errorEl = field.querySelector(`[data-error-for="${inputId}"]`);

  if (message) {
    field.classList.add("has-error");
    errorEl.textContent = message;
    const control = field.querySelector(".field__control");
    control.style.animation = "none";
    control.offsetHeight;
    control.style.animation = "";
  } else {
    field.classList.remove("has-error");
    errorEl.textContent = "";
  }
}

function clearFieldErrors(...inputIds) {
  inputIds.forEach((id) => setFieldError(id, ""));
}

function setFormMessage(messageEl, text, type) {
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

    submitBtn.disabled = true;

    try {
      await setPersistence(
        auth,
        rememberInput.checked ? browserLocalPersistence : browserSessionPersistence
      );

      await signInWithEmailAndPassword(
        auth,
        pseudoToTechnicalEmail(identifierInput.value),
        passwordInput.value
      );

      setFormMessage(message, "Connexion reussie - redirection a venir vers le dashboard.", "success");
    } catch (error) {
      setFormMessage(message, translateFirebaseError(error), "error");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/* ==========================================================================
   6) FORMULAIRE D'INSCRIPTION
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

    submitBtn.disabled = true;

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
        discordLinked: false,
      });

      setFormMessage(message, "Compte cree avec succes - vous etes connecte(e).", "success");
    } catch (error) {
      setFormMessage(message, translateFirebaseError(error), "error");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/* ==========================================================================
   7) MOT DE PASSE OUBLIE
   ========================================================================== */

function initForgotPassword() {
  const link = document.getElementById("forgot-password");
  const message = document.getElementById("login-message");

  link.addEventListener("click", (event) => {
    event.preventDefault();
    setFormMessage(
      message,
      "La recuperation de mot de passe necessite un e-mail associe au compte (a ajouter plus tard si besoin) : page non creee pour l'instant.",
      "info"
    );
  });
}

/* ==========================================================================
   8) CONNEXION DISCORD - preparation OAuth2 (sans backend pour l'instant)
   ==========================================================================

   Cette section prepare tout ce qu'il faut pour brancher, plus tard,
   une vraie authentification Discord OAuth2 couplee a ton bot et a
   Firebase (via un jeton personnalise genere par ton backend).
   Aucun appel reseau reel n'est effectue tant que CLIENT_ID n'est pas
   renseigne : voir l'explication fournie avec ce projet.
   ========================================================================== */

const DISCORD_OAUTH_CONFIG = {
  clientId: "VOTRE_CLIENT_ID_DISCORD",
  redirectUri: "https://VOTRE_REGION-VOTRE_PROJET.cloudfunctions.net/discordAuthCallback",
  scope: ["identify", "email", "guilds"],
  endpoint: "https://discord.com/api/oauth2/authorize",
};

function buildDiscordAuthUrl(config) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scope.join(" "),
    prompt: "consent",
  });

  return `${config.endpoint}?${params.toString()}`;
}

function initDiscordLogin() {
  const buttons = document.querySelectorAll("[data-discord-trigger]");
  const loginMessage = document.getElementById("login-message");
  const registerMessage = document.getElementById("register-message");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const message = btn.closest("#panel-register") ? registerMessage : loginMessage;
      const isConfigured = DISCORD_OAUTH_CONFIG.clientId !== "VOTRE_CLIENT_ID_DISCORD";

      if (!isConfigured) {
        setFormMessage(
          message,
          "Connexion Discord non configuree pour le moment (voir la section OAuth2 dans JS/login.js et les explications fournies).",
          "info"
        );
        return;
      }

      window.location.href = buildDiscordAuthUrl(DISCORD_OAUTH_CONFIG);
    });
  });
}