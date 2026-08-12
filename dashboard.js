import { auth, db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const userInfoDiv = document.getElementById('user-info');
const discordModal = document.getElementById('discord-modal');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            userInfoDiv.innerHTML = `<p>Connecté en tant que : <strong>${userData.pseudo}</strong></p>`;
            
            // Si le discordId n'existe pas, on affiche la modale
            if (!userData.discordId) {
                discordModal.style.display = 'flex';
            }
        }
    } else {
        window.location.href = "index.html"; // Rediriger si non connecté
    }
});

document.getElementById('btn-link').addEventListener('click', () => {
    // Redirection directe vers Discord avec ton URL générée
    window.location.href = "https://discord.com/oauth2/authorize?client_id=1522661512412659772&response_type=code&redirect_uri=https%3A%2F%2Forion-153.github.io%2FAura_Intranet%2Fdashboard.html&scope=identify";
});