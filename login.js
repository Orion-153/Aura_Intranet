/* ==========================================================================
   INTRANET — LOGIN / REGISTER
   Thème, onglets, validation des formulaires et préparation OAuth2 Discord.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initTabs();
  initPasswordVisibilityToggles();
  initLoginForm();
  initRegisterForm();
  initForgotPassword();
  initDiscordLogin();
});

/* ==========================================================================
   1) THÈME (clair / sombre) — persistance via localStorage
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

  // 1. Thème déjà choisi et mémorisé par l'utilisateur
  const savedTheme = localStorage.getItem(STORAGE_KEY);

  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    // 2. Sinon, on respecte la préférence système
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
   2) ONGLETS Connexion / Inscription
   ========================================================================== */

function initTabs() {
  const tabsWrapper = document.querySelector(".tabs");
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const panelLogin = document.getElementById("panel-login");
  const panelRegister = document.getElementById("panel-register");

  const title = document.getElementById("form-title");
  const subtitle = document.getElementById("form-subtitle");

  const footerLoginText = document.getElementById("footer-login-text");
  const footerRegisterText = document.getElementById("footer-register-text");

  const switchToRegister = document.getElementById("switch-to-register");
  const switchToLogin = document.getElementById("switch-to-login");

  const copy = {
    login: {
      title: "Content de vous revoir",
      subtitle: "Connectez-vous pour accéder à votre espace",
    },
    register: {
      title: "Créer votre compte",
      subtitle: "Rejoignez l'intranet en quelques secondes",
    },
  };

  function showTab(target) {
    const isLogin = target === "login";

    tabsWrapper.dataset.active = target;

    tabLogin.classList.toggle("is-active", isLogin);
    tabRegister.classList.toggle("is-active", !isLogin);
    tabLogin.setAttribute("aria-selected", String(isLogin));
    tabRegister.setAttribute("aria-selected", String(!isLogin));

    panelLogin.classList.toggle("is-active", isLogin);
    panelRegister.classList.toggle("is-active", !isLogin);

    footerLoginText.hidden = !isLogin;
    footerRegisterText.hidden = isLogin;

    title.textContent = isLogin ? copy.login.title : copy.register.title;
    subtitle.textContent = isLogin ? copy.login.subtitle : copy.register.subtitle;
  }

  tabLogin.addEventListener("click", () => showTab("login"));
  tabRegister.addEventListener("click", () => showTab("register"));
  switchToRegister.addEventListener("click", () => showTab("register"));
  switchToLogin.addEventListener("click", () => showTab("login"));
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
      btn.classList.toggle("is-visible", isHidden);
    });
  });
}

/* ==========================================================================
   4) OUTILS DE VALIDATION
   ========================================================================== */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Affiche / retire une erreur sur un champ donné (id de l'input). */
function setFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  const field = input.closest(".field");
  const errorEl = field.querySelector(`[data-error-for="${inputId}"]`);

  if (message) {
    field.classList.add("has-error");
    errorEl.textContent = message;
    // Relance l'animation de secousse à chaque nouvelle erreur
    field.querySelector(".field__control").style.animation = "none";
    // eslint-disable-next-line no-unused-expressions
    field.querySelector(".field__control").offsetHeight; // force reflow
    field.querySelector(".field__control").style.animation = "";
  } else {
    field.classList.remove("has-error");
    errorEl.textContent = "";
  }
}

function clearFieldErrors(...inputIds) {
  inputIds.forEach((id) => setFieldError(id, ""));
}

/** Affiche un message global sous un formulaire (erreur / succès / info). */
function setFormMessage(messageEl, text, type) {
  messageEl.textContent = text;
  messageEl.classList.remove("is-error", "is-success", "is-info", "is-visible");

  if (text) {
    messageEl.classList.add("is-visible", `is-${type}`);
  }
}

/* ==========================================================================
   5) FORMULAIRE DE CONNEXION
   ========================================================================== */

function initLoginForm() {
  const form = document.getElementById("panel-login");
  const identifierInput = document.getElementById("login-identifier");
  const passwordInput = document.getElementById("login-password");
  const message = document.getElementById("login-message");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearFieldErrors("login-identifier", "login-password");
    setFormMessage(message, "", null);

    let hasError = false;

    if (identifierInput.value.trim().length === 0) {
      setFieldError("login-identifier", "Veuillez saisir votre e-mail ou votre pseudo.");
      hasError = true;
    }

    if (passwordInput.value.length === 0) {
      setFieldError("login-password", "Veuillez saisir votre mot de passe.");
      hasError = true;
    } else if (passwordInput.value.length < 6) {
      setFieldError("login-password", "Le mot de passe doit contenir au moins 6 caractères.");
      hasError = true;
    }

    if (hasError) {
      setFormMessage(message, "Merci de corriger les champs indiqués ci-dessus.", "error");
      return;
    }

    // -----------------------------------------------------------------
    // Aucun backend n'est branché pour le moment : on se contente
    // de confirmer que le formulaire est valide côté client.
    // C'est ici que sera envoyée la requête vers l'API d'authentification.
    // -----------------------------------------------------------------
    setFormMessage(message, "Formulaire valide — connexion réelle à brancher côté serveur.", "success");
  });
}

/* ==========================================================================
   6) FORMULAIRE D'INSCRIPTION
   ========================================================================== */

function initRegisterForm() {
  const form = document.getElementById("panel-register");
  const usernameInput = document.getElementById("register-username");
  const emailInput = document.getElementById("register-email");
  const passwordInput = document.getElementById("register-password");
  const confirmInput = document.getElementById("register-confirm");
  const message = document.getElementById("register-message");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearFieldErrors("register-username", "register-email", "register-password", "register-confirm");
    setFormMessage(message, "", null);

    let hasError = false;

    if (usernameInput.value.trim().length < 3) {
      setFieldError("register-username", "Le pseudo doit contenir au moins 3 caractères.");
      hasError = true;
    }

    if (!EMAIL_REGEX.test(emailInput.value.trim())) {
      setFieldError("register-email", "Veuillez saisir une adresse e-mail valide.");
      hasError = true;
    }

    if (passwordInput.value.length < 8) {
      setFieldError("register-password", "Le mot de passe doit contenir au moins 8 caractères.");
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
      setFormMessage(message, "Merci de corriger les champs indiqués ci-dessus.", "error");
      return;
    }

    // -----------------------------------------------------------------
    // Aucun backend n'est branché pour le moment : on se contente
    // de confirmer que le formulaire est valide côté client.
    // C'est ici que sera envoyée la requête vers l'API de création de compte.
    // -----------------------------------------------------------------
    setFormMessage(message, "Formulaire valide — création de compte réelle à brancher côté serveur.", "success");
  });
}

/* ==========================================================================
   7) « MOT DE PASSE OUBLIÉ »
   ========================================================================== */

function initForgotPassword() {
  const link = document.getElementById("forgot-password");
  const message = document.getElementById("login-message");

  link.addEventListener("click", (event) => {
    event.preventDefault();
    setFormMessage(
      message,
      "La récupération de mot de passe sera disponible avec le backend (page non créée pour l'instant).",
      "info"
    );
  });
}

/* ==========================================================================
   8) CONNEXION DISCORD — préparation OAuth2 (sans backend pour l'instant)
   ==========================================================================

   Cette section prépare tout ce qu'il faut pour brancher, plus tard,
   une vraie authentification Discord OAuth2 couplée à votre bot.
   Aucun appel réseau réel n'est effectué tant que CLIENT_ID n'est pas
   renseigné : voir l'explication fournie avec ce projet.
   ========================================================================== */

const DISCORD_OAUTH_CONFIG = {
  // À remplacer par l'identifiant de votre application Discord
  // (onglet "OAuth2" du portail développeur Discord).
  clientId: "VOTRE_CLIENT_ID_DISCORD",

  // URL vers laquelle Discord redirigera l'utilisateur après connexion.
  // Doit être strictement identique à celle déclarée dans le portail Discord.
  redirectUri: "http://localhost:3000/auth/discord/callback",

  // Permissions demandées à l'utilisateur.
  // "identify" + "email" suffisent pour récupérer id / pseudo / avatar / e-mail.
  // Ajoutez "guilds" et "guilds.members.read" si vous voulez aussi
  // récupérer les rôles du serveur via votre bot côté backend.
  scope: ["identify", "email", "guilds"],

  endpoint: "https://discord.com/api/oauth2/authorize",
};

/**
 * Construit l'URL d'autorisation OAuth2 Discord à partir de la configuration
 * ci-dessus. Cette fonction est prête à l'emploi dès que clientId et
 * redirectUri auront été renseignés avec vos vraies valeurs.
 */
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
  const discordBtn = document.getElementById("discord-login");
  const message = document.getElementById("login-message");

  discordBtn.addEventListener("click", () => {
    const isConfigured = DISCORD_OAUTH_CONFIG.clientId !== "VOTRE_CLIENT_ID_DISCORD";

    if (!isConfigured) {
      // Pas de simulation de connexion : on informe simplement
      // que l'intégration nécessite un backend pour être fonctionnelle.
      setFormMessage(
        message,
        "Connexion Discord non configurée pour le moment (voir la section OAuth2 dans le JS et les explications fournies).",
        "info"
      );
      return;
    }

    // Une fois configuré, il suffira de rediriger l'utilisateur :
    window.location.href = buildDiscordAuthUrl(DISCORD_OAUTH_CONFIG);
  });
}