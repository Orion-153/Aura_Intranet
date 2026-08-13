/* ==========================================================================
   INTRANET — DASHBOARD
   ========================================================================== */

import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle(); // Reprend le thème du login
  initDashboardAuth();
});

/* ==========================================================================
   1) GESTION DU THÈME (Même logique que login.js)
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

  // Charge le thème choisi depuis le login
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  }

  // Écouteur sur le bouton du Dashboard
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
   2) GESTION DE L'AUTHENTIFICATION FIREBASE
   ========================================================================== */
function initDashboardAuth() {
  const welcomeTitle = document.getElementById("welcome-title");
  const userInitial = document.getElementById("user-initial");
  const btnLogout = document.getElementById("btn-logout");

  // Vérifie l'état de connexion en temps réel
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // Si non connecté, retour forcé au login
      window.location.href = "index.html";
    } else {
      // Affichage du nom et de l'initiale
      const pseudo = user.displayName || "Utilisateur";
      welcomeTitle.textContent = `Bonjour, ${pseudo} !`;
      userInitial.textContent = pseudo.charAt(0).toUpperCase();
    }
  });

  // Déconnexion
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
