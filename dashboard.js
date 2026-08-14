/* ==========================================================================
   INTRANET — DASHBOARD
   ========================================================================== */

import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initSettingsModal();
  initAccentColors();
  initUserMenu();
  initDashboardAuth();
});

/* ==========================================================================
   1) GESTION DU THÈME (CLAIR / SOMBRE)
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

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const isDark = root.getAttribute("data-theme") === "dark";
      const nextTheme = isDark ? "light" : "dark";
      applyTheme(nextTheme);
      localStorage.setItem(STORAGE_KEY, nextTheme);
    });
  }
}

/* ==========================================================================
   2) FENÊTRE MODALE DES PARAMÈTRES
   ========================================================================== */
function initSettingsModal() {
  const openBtn = document.getElementById("btn-open-settings");
  const closeBtn = document.getElementById("btn-close-settings");
  const modal = document.getElementById("settings-modal");
  const dropdown = document.getElementById("user-dropdown");

  if (!openBtn || !modal) return;

  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    dropdown?.classList.remove("is-open");
    modal.classList.add("is-open");
  });

  closeBtn?.addEventListener("click", () => {
    modal.classList.remove("is-open");
  });

  // Fermer si on clique en dehors de la carte de paramètres
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("is-open");
    }
  });
}

/* ==========================================================================
   3) GESTION DE LA COULEUR D'ACCENTUATION (DANS PARAMÈTRES)
   ========================================================================== */
function initAccentColors() {
  const STORAGE_KEY = "intranet-accent-color";
  const root = document.documentElement;
  const colorOptions = document.querySelectorAll(".color-option");

  const colors = {
    purple:  { accent: "#5B5FEF", gradient: "#8B7CF6", haloLight: "rgba(91, 95, 239, 0.12)", haloDark: "rgba(91, 95, 239, 0.15)" },
    blue:    { accent: "#3b82f6", gradient: "#60a5fa", haloLight: "rgba(59, 130, 246, 0.12)", haloDark: "rgba(59, 130, 246, 0.15)" },
    emerald: { accent: "#10b981", gradient: "#34d399", haloLight: "rgba(16, 185, 129, 0.12)", haloDark: "rgba(16, 185, 129, 0.15)" },
    rose:    { accent: "#f43f5e", gradient: "#fb7185", haloLight: "rgba(244, 63, 94, 0.12)",  haloDark: "rgba(244, 63, 94, 0.15)" },
    amber:   { accent: "#f59e0b", gradient: "#fbbf24", haloLight: "rgba(245, 158, 11, 0.12)",  haloDark: "rgba(245, 158, 11, 0.15)" }
  };

  const applyAccentColor = (colorName) => {
    const theme = colors[colorName];
    if (!theme) return;

    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-gradient", theme.gradient);
    
    const isDark = root.getAttribute("data-theme") === "dark";
    root.style.setProperty("--halo-color", isDark ? theme.haloDark : theme.haloLight);

    colorOptions.forEach(opt => {
      opt.classList.toggle("is-active", opt.dataset.color === colorName);
    });
  };

  const savedColor = localStorage.getItem(STORAGE_KEY) || "purple";
  applyAccentColor(savedColor);

  colorOptions.forEach(opt => {
    opt.addEventListener("click", () => {
      const colorName = opt.dataset.color;
      applyAccentColor(colorName);
      localStorage.setItem(STORAGE_KEY, colorName);
    });
  });
  
  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    const currentColor = localStorage.getItem(STORAGE_KEY) || "purple";
    applyAccentColor(currentColor);
  });
}

/* ==========================================================================
   4) MENU UTILISATEUR DÉROULANT
   ========================================================================== */
function initUserMenu() {
  const menuBtn = document.getElementById("user-menu-btn");
  const dropdown = document.getElementById("user-dropdown");

  if (!menuBtn || !dropdown) return;

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", dropdown.classList.contains("is-open"));
  });

  document.addEventListener("click", (e) => {
    if (dropdown.classList.contains("is-open") && !dropdown.contains(e.target)) {
      dropdown.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });
}

/* ==========================================================================
   5) GESTION DE L'AUTHENTIFICATION FIREBASE
   ========================================================================== */
function initDashboardAuth() {
  const welcomeTitle = document.getElementById("welcome-title");
  const userInitial = document.getElementById("user-initial");
  const userNameDisplay = document.getElementById("user-name-display");
  const dropdownName = document.getElementById("dropdown-name");
  const btnLogout = document.getElementById("btn-logout");

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "index.html";
    } else {
      const pseudo = user.displayName || "Utilisateur";
      welcomeTitle.textContent = `Bonjour, ${pseudo} !`;
      userInitial.textContent = pseudo.charAt(0).toUpperCase();
      userNameDisplay.textContent = pseudo;
      dropdownName.textContent = pseudo;
    }
  });

  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      try {
        await signOut(auth);
        window.location.href = "index.html";
      } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);
      }
    });
  }
}
