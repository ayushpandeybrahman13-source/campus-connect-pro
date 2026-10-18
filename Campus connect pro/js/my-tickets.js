
/* =========================================
   CampusConnect Pro
   File: js/my-ticket.js
   Student Ticket Management
========================================= */

"use strict";

document.addEventListener("DOMContentLoaded", function () {
    const app = window.CampusConnect;

    const container = document.getElementById("ticketList");
    const notice = document.getElementById("ticketNotice");

    if (!container || !notice) return;

    // Check application functions
    if (
        !app ||
        !app.STORAGE_KEYS ||
        typeof app.getData !== "function" ||
        typeof app.escapeHTML !== "function"
    ) {
        notice.textContent =
            "Application load nahi hui. Please main.js check karo.";
        container.innerHTML = "";
        return;
    }

    // Get current logged-in student
    const user = typeof app.getCurrentUser === "function"
        ? app.getCurrentUser()
        : null;

    if (!user) {
        notice.textContent = "Tickets dekhne ke liye login karo.";

        container.innerHTML = `
            <div class="empty-state">
                <div class="emoji">🔐</div>
                <h2>Login Required</h2>
                <p class="muted">
                    Please login to view your event tickets.
                </p>
                <a class="btn" href="login.html">Login Now</a>
            </div>
        `;

        return;
    }

    // Safely read stored arrays
    function getList(key) {
        const data = app.getData(key, []);
        return Array.isArray(data) ? data : [];
    }

    // Escape HTML to prevent injected markup
    function safe(value) {
        return app.escapeHTML(String(value ?? ""));
    }

    // Format date using shared application function
    function formatDate(value) {
        if (!value) return "Not specified";

        if (typeof app.formatDate === "function") {
            return app.formatDate(value);
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Not specified";
        }

        return date.toLocaleDateString();
    }

    // Load registrations and events
    function getMyTickets() {
        const registrations = getList(
            app.STORAGE_KEYS.registrations
        );

        const userId = String(user.id || "");
        const email = String(user.email || "").trim().toLowerCase();

        return registrations.filter(function (registration) {
            const idMatches =
                userId &&
                String(registration.userId || "") === userId;

            const emailMatches =
                email &&
                String(registration.userEmail || "")
                    .trim()
                    .toLowerCase() === email;

            return Boolean(idMatches || emailMatches);
        });
    }

    // Render one ticket
    function renderTicket(registration, events) {
        const linkedEvent = events.find(function (event) {
            return String(event.id) === String(registration.eventId);
        });

        const title =
            registration.eventTitle ||
            linkedEvent?.title ||
            "Campus Event";

        const date =
            registration.eventDate ||
            linkedEvent?.date ||
            "";

        const time =
            registration.eventTime ||
            linkedEvent?.time ||
            "";

        const venue =
            registration.venue ||
            linkedEvent?.venue ||
            "Not specified";

        const status = String(
            registration.status || "Confirmed"
        );

        const normalizedStatus = status.toLowerCase();

        let statusClass = "";

        if (normalizedStatus === "pending") {
            statusClass = "pending";
        } else if (normalizedStatus === "cancelled") {
            statusClass = "cancelled";
        }

        const ticketId =
            registration.ticketId ||
            registration.id ||
            "Not available";

        return `
            <article class="ticket">
                <div class="ticket-header">
                    <h2>${safe(title)}</h2>
                    <p>CampusConnect Pro · Event Ticket</p>

                    <span class="status ${statusClass}">
                        ${safe(status)}
                    </span>
                </div>

                <div class="ticket-body">
                    <div>
                        <span class="detail-label">Attendee</span>
                        <div class="detail-value">
                            ${safe(
                                registration.userName ||
                                user.name ||
                                "Student"
                            )}
                        </div>
                    </div>

                    <div>
                        <span class="detail-label">Email</span>
                        <div class="detail-value">
                            ${safe(
                                registration.userEmail ||
                                user.email ||
                                "Not specified"
                            )}
                        </div>
                    </div>

                    <div>
                        <span class="detail-label">Event Date</span>
                        <div class="detail-value">
                            ${safe(formatDate(date))}
                        </div>
                    </div>

                    <div>
                        <span class="detail-label">Event Time</span>
                        <div class="detail-value">
                            ${safe(time || "Not specified")}
                        </div>
                    </div>

                    <div>
                        <span class="detail-label">Venue</span>
                        <div class="detail-value">
                            ${safe(venue)}
                        </div>
                    </div>

                    <div>
                        <span class="detail-label">Ticket ID</span>
                        <div class="detail-value">
                            ${safe(ticketId)}
                        </div>
                    </div>
                </div>

                <div class="ticket-footer">
                    <div class="ticket-id">
                        Registration ID:
                        ${safe(registration.id || "N/A")}
                    </div>

                    <div class="ticket-actions">
                        <button
                            type="button"
                            class="btn"
                            data-print-ticket
                        >
                            🖨️ Print Ticket
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    // Display tickets
    function renderTickets() {
        const tickets = getMyTickets();
        const events = getList(app.STORAGE_KEYS.events);

        if (tickets.length === 0) {
            notice.textContent =
                "Abhi tumhare account mein koi registered ticket nahi hai.";

            container.innerHTML = `
                <div class="empty-state">
                    <div class="emoji">🎫</div>
                    <h2>No Tickets Yet</h2>
                    <p class="muted">
                        Events explore karo aur registration karne
                        ke baad apne tickets yahan dekho.
                    </p>
                    <a class="btn" href="events.html">
                        Explore Events
                    </a>
                </div>
            `;

            return;
        }

        notice.textContent =
            "Tumhare account mein " +
            tickets.length +
            " registration(s) hain.";

        container.innerHTML = tickets
            .map(function (ticket) {
                return renderTicket(ticket, events);
            })
            .join("");
    }

    // Print the selected ticket
    container.addEventListener("click", function (event) {
        const button = event.target.closest("[data-print-ticket]");

        if (!button) return;

        const ticket = button.closest(".ticket");

        if (!ticket) return;

        // Print only the selected ticket
        const printWindow = window.open("", "_blank");

        if (!printWindow) {
            alert(
                "Print window blocked hai. Browser mein pop-ups allow karo."
            );
            return;
        }

        const printableTicket = ticket.cloneNode(true);

        printableTicket
            .querySelectorAll(".ticket-actions")
            .forEach(function (element) {
                element.remove();
            });

        printWindow.document.open();

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport"
                    content="width=device-width, initial-scale=1.0">
                <title>My Event Ticket</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 25px;
                        color: #111827;
                    }

                    .ticket {
                        max-width: 700px;
                        margin: auto;
                        border: 1px solid #999;
                        border-radius: 12px;
                        overflow: hidden;
                    }

                    .ticket-header,
                    .ticket-body,
                    .ticket-footer {
                        padding: 20px;
                    }

                    .ticket-header {
                        background: #f3f4f6;
                        border-bottom: 1px dashed #888;
                    }

                    .ticket-body {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                    }

                    .detail-label {
                        display: block;
                        margin-bottom: 6px;
                        color: #555;
                        font-size: 12px;
                    }

                    .detail-value {
                        overflow-wrap: anywhere;
                    }

                    .ticket-footer {
                        border-top: 1px solid #ddd;
                    }

                    .status {
                        display: inline-block;
                        margin-top: 8px;
                        padding: 5px 10px;
                        border: 1px solid #888;
                        border-radius: 20px;
                    }

                    @media print {
                        body { padding: 0; }
                    }

                    @media (max-width: 500px) {
                        .ticket-body {
                            grid-template-columns: 1fr;
                        }
                    }
                </style>
            </head>
            <body>
                ${printableTicket.outerHTML}
                <script>
                    window.onload = function () {
                        window.print();
                    };
                <\/script>
            </body>
            </html>
        `);

        printWindow.document.close();
    });

    // Initial render
    renderTickets();

    console.log("My Tickets page initialized.");
});