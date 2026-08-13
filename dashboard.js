import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initModals();
  initAccentColors();
  initUserMenu();
  initDashboardAuth();
});

/* ==========================================================================
   1) GESTION DU THÈME
   ========================================================================== */
function initThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle");
  const root = document.documentElement;
  
  const savedTheme = localStorage.getItem("intranet-theme") || "dark";
  if (savedTheme === "dark") root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");

  toggleBtn?.addEventListener("click", () => {
    const isDark = root.getAttribute("data-theme") === "dark";
    if (isDark) {
      root.removeAttribute("data-theme");
      localStorage.setItem("intranet-theme", "light");
    } else {
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("intranet-theme", "dark");
    }
  });
}

/* ==========================================================================
   2) GESTION DES MODALES (PROFIL ET PARAMÈTRES)
   ========================================================================== */
function initModals() {
  const dropdown = document.getElementById("user-dropdown");
  
  // Modale Paramètres
  const settingsModal = document.getElementById("settings-modal");
  document.getElementById("btn-open-settings")?.addEventListener("click", () => {
    dropdown?.classList.remove("is-open");
    settingsModal.classList.add("is-open");
  });
  document.getElementById("btn-close-settings")?.addEventListener("click", () => {
    settingsModal.classList.remove("is-open");
  });

  // Modale Profil
  const profileModal = document.getElementById("profile-modal");
  document.getElementById("btn-open-profile")?.addEventListener("click", () => {
    dropdown?.classList.remove("is-open");
    profileModal.classList.add("is-open");
  });
  document.getElementById("btn-close-profile")?.addEventListener("click", () => {
    profileModal.classList.remove("is-open");
  });
  document.getElementById("btn-save-profile")?.addEventListener("click", () => {
    // Simuler une sauvegarde
    const btn = document.getElementById("btn-save-profile");
    const originalText = btn.textContent;
    btn.textContent = "Sauvegardé !";
    setTimeout(() => {
      btn.textContent = originalText;
      profileModal.classList.remove("is-open");
    }, 1500);
  });

  // Fermer au clic en dehors
  window.addEventListener("click", (e) => {
    if (e.target === settingsModal) settingsModal.classList.remove("is-open");
    if (e.target === profileModal) profileModal.classList.remove("is-open");
  });
}

/* ==========================================================================
   3) COULEURS D'ACCENTUATION
   ========================================================================== */
function initAccentColors() {
  const root = document.documentElement;
  const colorOptions = document.querySelectorAll(".color-option");

  const colors = {
    indigo: { accent: "#4f46e5", light: "rgba(79, 70, 229, 0.1)" },
    emerald: { accent: "#10b981", light: "rgba(16, 185, 129, 0.1)" },
    rose: { accent: "#e11d48", light: "rgba(225, 29, 72, 0.1)" }
  };

  const applyColor = (colorName) => {
    const theme = colors[colorName];
    if (!theme) return;
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-light", theme.light);
    
    colorOptions.forEach(opt => {
      opt.classList.toggle("is-active", opt.dataset.color === colorName);
    });
  };

  const savedColor = localStorage.getItem("intranet-color") || "indigo";
  applyColor(savedColor);

  colorOptions.forEach(opt => {
    opt.addEventListener("click", () => {
      applyColor(opt.dataset.color);
      localStorage.setItem("intranet-color", opt.dataset.color);
    });
  });
}

/* ==========================================================================
   4) MENU UTILISATEUR
   ========================================================================== */
function initUserMenu() {
  const menuBtn = document.getElementById("user-menu-btn");
  const dropdown = document.getElementById("user-dropdown");

  menuBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("is-open");
  });

  document.addEventListener("click", (e) => {
    if (dropdown && dropdown.classList.contains("is-open") && !dropdown.contains(e.target)) {
      dropdown.classList.remove("is-open");
    }
  });
}

/* ==========================================================================
   5) FIREBASE AUTHENTIFICATION
   ========================================================================== */
function initDashboardAuth() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "index.html"; // Rediriger si non connecté
    } else {
      const pseudo = user.displayName || "Membre";
      const email = user.email || "Non renseigné";
      const initial = pseudo.charAt(0).toUpperCase();

      // Mettre à jour l'interface principale
      document.getElementById("welcome-name").textContent = pseudo;
      document.getElementById("user-initial").textContent = initial;
      document.getElementById("dropdown-name").textContent = pseudo;

      // Mettre à jour la modale Profil
      document.getElementById("profile-avatar").textContent = initial;
      document.getElementById("profile-name").textContent = pseudo;
      document.getElementById("profile-email").textContent = email;
    }
  });

  document.getElementById("btn-logout")?.addEventListener("click", async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    }
  });
}
