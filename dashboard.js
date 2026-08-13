import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const userDisplay = document.getElementById("user-display-name");
    const userInitial = document.getElementById("user-initial");
    const welcomeTitle = document.getElementById("welcome-title");
    const btnLogout = document.getElementById("btn-logout");

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "index.html";
        } else {
            const pseudo = user.displayName || "Utilisateur";
            userDisplay.textContent = pseudo;
            userInitial.textContent = pseudo.charAt(0).toUpperCase();
            welcomeTitle.textContent = `Bonjour, ${pseudo} !`;
        }
    });

    btnLogout.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "index.html";
        } catch (error) {
            console.error("Erreur de déconnexion:", error);
        }
    });
});
