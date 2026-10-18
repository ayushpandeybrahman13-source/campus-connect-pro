
"use strict";

/* =========================================
   CampusConnect Pro
   File: js/auth-demo.js

   Demo authentication:
   - Student registration
   - Login and logout
   - Current user session
   - Compatible with main.js
========================================= */

(function () {
    const app = window.CampusConnect;

    if (!app) {
        console.error(
            "CampusConnect missing. Load js/main.js before auth-demo.js."
        );
        return;
    }

    const KEYS = app.STORAGE_KEYS;

    function getUsers() {
        const users = app.getData(KEYS.users, []);
        return Array.isArray(users) ? users : [];
    }

    function saveUsers(users) {
        return app.saveData(KEYS.users, users);
    }

    function normalizeEmail(email) {
        return String(email || "").trim().toLowerCase();
    }

    function safeUser(user) {
        // Never return the stored password to the page.
        const { password, ...publicUser } = user;
        return publicUser;
    }

    function getCurrentUser() {
        return app.getCurrentUser();
    }

    function setCurrentUser(user) {
        return app.setCurrentUser(user);
    }

    /*
     * Register a new student.
     * Demo only: passwords are stored in localStorage.
     * Do not use this authentication for a real production website.
     */
    function register(name, email, password) {
        name = String(name || "").trim();
        email = normalizeEmail(email);
        password = String(password || "");

        if (name.length < 2) {
            return { success: false, message: "Enter your full name." };
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return { success: false, message: "Enter a valid email address." };
        }

        if (password.length < 6) {
            return {
                success: false,
                message: "Password must contain at least 6 characters."
            };
        }

        const users = getUsers();

        const exists = users.some(function (user) {
            return normalizeEmail(user.email) === email;
        });

        if (exists) {
            return {
                success: false,
                message: "An account with this email already exists."
            };
        }

        const user = {
            id: app.createId("USR"),
            name: name,
            email: email,
            password: password,
            role: "student",
            createdAt: new Date().toISOString()
        };

        if (!saveUsers([...users, user])) {
            return {
                success: false,
                message: "Account save nahi hua. Browser storage check karo."
            };
        }

        return {
            success: true,
            message: "Account created successfully!",
            user: safeUser(user)
        };
    }

    /*
     * Login.
     * Returns true on success and false on failure,
     * as expected by the provided login.html.
     */
    function login(email, password) {
        email = normalizeEmail(email);
        password = String(password || "");

        const users = getUsers();

        const user = users.find(function (item) {
            return normalizeEmail(item.email) === email &&
                item.password === password;
        });

        if (!user) {
            return false;
        }

        const publicUser = safeUser(user);

        if (!setCurrentUser(publicUser)) {
            return false;
        }

        return true;
    }

    function logout() {
        setCurrentUser(null);
        window.location.href = "login.html";
    }

    function isLoggedIn() {
        return Boolean(getCurrentUser());
    }

    function requireLogin() {
        if (!isLoggedIn()) {
            window.location.href =
                "login.html?next=" +
                encodeURIComponent(
                    window.location.pathname.split("/").pop()
                );

            return false;
        }

        return true;
    }

    function updateProfile(updates) {
        const currentUser = getCurrentUser();

        if (!currentUser) {
            return {
                success: false,
                message: "Please log in first."
            };
        }

        const allowedUpdates = {};

        if (typeof updates.name === "string") {
            const name = updates.name.trim();

            if (name.length < 2) {
                return {
                    success: false,
                    message: "Name must contain at least 2 characters."
                };
            }

            allowedUpdates.name = name;
        }

        if (typeof updates.email === "string") {
            const email = normalizeEmail(updates.email);

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return {
                    success: false,
                    message: "Enter a valid email address."
                };
            }

            const duplicate = getUsers().some(function (user) {
                return user.id !== currentUser.id &&
                    normalizeEmail(user.email) === email;
            });

            if (duplicate) {
                return {
                    success: false,
                    message: "This email is already in use."
                };
            }

            allowedUpdates.email = email;
        }

        const users = getUsers();

        const updatedUsers = users.map(function (user) {
            if (user.id !== currentUser.id) return user;

            return {
                ...user,
                ...allowedUpdates,
                updatedAt: new Date().toISOString()
            };
        });

        if (!saveUsers(updatedUsers)) {
            return {
                success: false,
                message: "Profile save nahi hua."
            };
        }

        const updatedUser = updatedUsers.find(function (user) {
            return user.id === currentUser.id;
        });

        if (!updatedUser || !setCurrentUser(safeUser(updatedUser))) {
            return {
                success: false,
                message: "Profile update hua, lekin session refresh nahi hua."
            };
        }

        return {
            success: true,
            message: "Profile updated successfully!",
            user: safeUser(updatedUser)
        };
    }

    // Expose the API used by login.html and other pages.
    window.CampusAuth = {
        register,
        login,
        logout,
        getCurrentUser,
        isLoggedIn,
        requireLogin,
        updateProfile
    };

    console.log("CampusConnect authentication demo loaded.");
})();