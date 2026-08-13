import { auth, db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Éléments du DOM
const userInfoDiv = document.getElementById('user-info');
const topbarPseudo = document.getElementById('topbar-pseudo');
const profileDetails = document.getElementById('profile-details');
const discordModal = document.getElementById('discord-modal');

// Initialisation Firebase Auth
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Mise à jour de l'affichage
            userInfoDiv.innerHTML = `<p>Connecté en tant que : <strong>${userData.pseudo}</strong></p>`;
            topbarPseudo.textContent = userData.pseudo;
            
            // Remplissage de la page Profil
            profileDetails.innerHTML = `
                <p><strong>Email :</strong> ${user.email}</p>
                <p><strong>Pseudo :</strong> ${userData.pseudo}</p>
                <p><strong>Statut Discord :</strong> ${userData.discordId ? 'Lié ✅' : 'Non lié ❌'}</p>
            `;
            
            // Si le discordId n'existe pas, on affiche la modale
            if (!userData.discordId) {
                discordModal.classList.remove('hidden');
            }
        }
    } else {
        window.location.href = "index.html"; // Rediriger si non connecté
    }
});

// Bouton Discord
document.getElementById('btn-link').addEventListener('click', () => {
    window.location.href = "https://discord.com/oauth2/authorize?client_id=1522661512412659772&response_type=code&redirect_uri=https%3A%2F%2Forion-153.github.io%2FAura_Intranet%2Fdashboard.html&scope=identify";
});

// ==========================================
// LOGIQUE DE L'INTERFACE (UI)
// ==========================================

// Gestion du menu déroulant (Profil)
const profileBtn = document.getElementById('profile-btn');
const profileDropdown = document.getElementById('profile-dropdown');

profileBtn.addEventListener('click', () => {
    profileDropdown.classList.toggle('hidden');
});

// Fermer le menu si on clique ailleurs
document.addEventListener('click', (e) => {
    if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
        profileDropdown.classList.add('hidden');
    }
});

// Bouton "Voir mon profil" dans le menu déroulant
document.getElementById('go-to-profile').addEventListener('click', () => {
    switchSection('profile-section');
    profileDropdown.classList.add('hidden');
});

// Déconnexion
document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = "index.html";
    });
});

// Gestion des onglets de navigation (Sidebar)
const navButtons = document.querySelectorAll('.nav-btn');
const viewSections = document.querySelectorAll('.view-section');

function switchSection(targetId) {
    // 1. Cacher toutes les sections
    viewSections.forEach(section => section.classList.add('hidden'));
    // 2. Afficher la bonne section
    document.getElementById(targetId).classList.remove('hidden');
    
    // 3. Mettre à jour l'état actif des boutons
    navButtons.forEach(btn => {
        if (btn.dataset.target === targetId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Ajouter les écouteurs sur les boutons de la sidebar
navButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const targetId = e.target.dataset.target;
        switchSection(targetId);
    });
});
