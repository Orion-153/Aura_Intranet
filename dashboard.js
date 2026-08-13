import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const userDisplay = document.getElementById("user-display-name");
    const btnLogout = document.getElementById("btn-logout");

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "index.html";
        } else {
            userDisplay.textContent = user.displayName || "Utilisateur";
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
