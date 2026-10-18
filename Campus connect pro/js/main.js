
"use strict";

/* =========================================
   CampusConnect Pro
   Main JavaScript
   Shared storage, authentication helpers,
   formatting, notifications and utilities.
========================================= */

(function () {
    const STORAGE_KEYS = Object.freeze({
        users: "cc_users",
        currentUser: "cc_current_user",
        events: "cc_events",
        registrations: "cc_registrations",
        clubs: "cc_clubs"
    });

    // Safe localStorage helpers
    function getData(key, fallback = []) {
        try {
            const raw = localStorage.getItem(key);

            if (raw === null) return fallback;

            return JSON.parse(raw);
        } catch (error) {
            console.error("Unable to read storage:", key, error);
            return fallback;
        }
    }

    function saveData(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error("Unable to save storage:", key, error);
            showToast("Data save nahi hua. Browser storage check karo.", "error");
            return false;
        }
    }

    function createId(prefix = "ID") {
        const random = Math.random().toString(36).slice(2, 9).toUpperCase();
        return prefix + "-" + Date.now().toString(36).toUpperCase() + "-" + random;
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (character) {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[character];
        });
    }

    function formatDate(value) {
        if (!value) return "Not specified";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    function showToast(message, type = "info") {
        let toast = document.getElementById("cc-toast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "cc-toast";

            Object.assign(toast.style, {
                position: "fixed",
                bottom: "22px",
                right: "22px",
                zIndex: "99999",
                maxWidth: "min(360px, 90vw)",
                padding: "13px 18px",
                borderRadius: "10px",
                color: "#ffffff",
                background: "#253047",
                boxShadow: "0 8px 25px rgba(0,0,0,.25)",
                fontFamily: "Arial, sans-serif",
                fontSize: "14px",
                lineHeight: "1.5",
                display: "none"
            });

            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.background =
            type === "error" ? "#991b1b" :
            type === "success" ? "#166534" :
            "#253047";

        toast.style.display = "block";

        if (toast._hideTimer) {
            clearTimeout(toast._hideTimer);
        }

        toast._hideTimer = setTimeout(function () {
            toast.style.display = "none";
        }, 3000);
    }

    // Current login session
    function getCurrentUser() {
        const user = getData(STORAGE_KEYS.currentUser, null);

        return user && typeof user === "object" ? user : null;
    }

    function setCurrentUser(user) {
        if (user === null) {
            try {
                localStorage.removeItem(STORAGE_KEYS.currentUser);
                return true;
            } catch (error) {
                console.error("Unable to clear current user:", error);
                return false;
            }
        }

        return saveData(STORAGE_KEYS.currentUser, user);
    }

    function logout() {
        setCurrentUser(null);
        window.location.href = "login.html";
    }

    // Seed sample events and clubs only when storage is empty.
    // Existing saved data is preserved.
    function initializeData() {
        const events = getData(STORAGE_KEYS.events, null);

        if (!Array.isArray(events)) {
            saveData(STORAGE_KEYS.events, []);
        }

        const registrations = getData(STORAGE_KEYS.registrations, null);

        if (!Array.isArray(registrations)) {
            saveData(STORAGE_KEYS.registrations, []);
        }

        const clubs = getData(STORAGE_KEYS.clubs, null);

        if (!Array.isArray(clubs)) {
            saveData(STORAGE_KEYS.clubs, []);
        }

        const users = getData(STORAGE_KEYS.users, null);

        if (!Array.isArray(users)) {
            saveData(STORAGE_KEYS.users, []);
        }
    }

    // Shared API used by admin.js and my-ticket.js
    window.CampusConnect = {
        STORAGE_KEYS,
        getData,
        saveData,
        createId,
        escapeHTML,
        formatDate,
        showToast,
        getCurrentUser,
        setCurrentUser,
        logout
    };

    document.addEventListener("DOMContentLoaded", function () {
        initializeData();

        // Logout buttons can use data-logout.
        document.querySelectorAll("[data-logout]").forEach(function (button) {
            button.addEventListener("click", function (event) {
                event.preventDefault();

                if (confirm("Kya aap logout karna chahte hain?")) {
                    logout();
                }
            });
        });

        // Update elements that show the logged-in user's name.
        const user = getCurrentUser();

        if (user) {
            document.querySelectorAll("[data-user-name]").forEach(function (element) {
                element.textContent = user.name || user.fullName || "Student";
            });

            document.querySelectorAll("[data-user-email]").forEach(function (element) {
                element.textContent = user.email || "";
            });
        }

        console.log("CampusConnect main.js loaded successfully.");
    });
})();