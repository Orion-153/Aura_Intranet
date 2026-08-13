/* ==========================================================================
   INTRANET — DASHBOARD
   ========================================================================== */

import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initDashboardAuth();
  initUserMenu(); // Initialise le nouveau menu profil
});

/* ==========================================================================
   1) GESTION DU THÈME
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
   2) GESTION DE L'AUTHENTIFICATION FIREBASE
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
      
      // Mise à jour des textes avec le pseudo
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

/* ==========================================================================
   3) MENU UTILISATEUR DÉROULANT
   ========================================================================== */
function initUserMenu() {
  const menuBtn = document.getElementById("user-menu-btn");
  const dropdown = document.getElementById("user-dropdown");

  if (!menuBtn || !dropdown) return;

  // Ouvrir / Fermer au clic
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Évite que le clic ferme immédiatement le menu
    dropdown.classList.toggle("is-open");
    const isOpen = dropdown.classList.contains("is-open");
    menuBtn.setAttribute("aria-expanded", isOpen);
  });

  // Fermer le menu si on clique en dehors
  document.addEventListener("click", (e) => {
    if (dropdown.classList.contains("is-open") && !dropdown.contains(e.target)) {
      dropdown.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });
}
