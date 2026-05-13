/* =========================================================================
   common.js — shared utilities loaded on every page.

   Contents:
     1) Storage keys + low-level localStorage read/write helpers
     2) Users store (registered users array)
     3) Current-user session helpers + auth guard
     4) Appointments store + per-user / per-week / per-date lookups
     5) Shared form validators (used by every form on the site)
     6) SVG logo + navbar + footer injection (runs on every page)
     7) Loading overlay + toast notification
     8) Scroll-based fade-in animation observer
     9) Shared date-formatting helpers (Hebrew dates, ISO dates)

   Because Part B is frontend-only (no backend / no database), all data
   persists in the browser's localStorage. Each store is a JSON array
   serialized under one of the keys below.
   ========================================================================= */

/* ── 1. Storage Keys ─────────────────────────────────────────────────────── */
/* Each key namespaces a different "table" inside localStorage.
   Prefixed with "integrationCenter_" to avoid collisions with other sites. */
const USERS_KEY        = 'integrationCenter_users';          // Array of registered users
const CURRENT_USER_KEY = 'integrationCenter_currentUser';    // The user currently signed in
const APPTS_KEY        = 'integrationCenter_appointments';   // All appointments across users

/* ── Low-level JSON I/O ──────────────────────────────────────────────────── */
/* loadJSON / saveJSON wrap localStorage so the rest of the file can deal
   with real JavaScript objects/arrays instead of strings. The try/catch
   guards against corrupted JSON that would otherwise crash the page. */
function loadJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}
function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

/* ── 2. Users Store ──────────────────────────────────────────────────────── */
/* Holds every registered user. Each user has:
   { id, full_name, phone, email, password, created_at }
   Email lookup is case-insensitive so users don't get a duplicate-email
   error just because they typed a different capitalization. */
function getAllUsers()     { return loadJSON(USERS_KEY, []); }
function saveAllUsers(arr) { saveJSON(USERS_KEY, arr); }
function findUserByEmail(email) {
    return getAllUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

/* ── 3. Current User (session) ───────────────────────────────────────────── */
/* The "session" is just one record in localStorage. We never store the
   password in the current-user record (only on the user in the users
   array). logout() simply clears the session key and returns home. */
function getCurrentUser() { return loadJSON(CURRENT_USER_KEY, null); }
function setCurrentUser(user) { saveJSON(CURRENT_USER_KEY, user); }
function logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.href = 'index.html';
}

/* Pages that require auth call this on load. If no real user is logged in,
   we silently seed a "guest" identity so the page still renders — the demo
   has no real database, and forcing registration up-front blocks visual review.
   The registration / login form on auth.html still works for anyone who wants
   to create a real account. */
function requireAuth() {
    let user = getCurrentUser();
    if (!user) {
        user = {
            id: 1,
            full_name: 'אורח',
            email: 'guest@demo',
            phone: '0500000000',
            _guest: true,
            created_at: new Date().toISOString()
        };
        setCurrentUser(user);
    }
    return user;
}

/* ── 4. Appointments Store ───────────────────────────────────────────────── */
/* All appointments (every user combined) are kept in one array.
   Each appointment record looks like:
     { id, user_id, full_name, therapist_name, location,
       appointment_time (ISO datetime), treatment_type, notes, created_at }
   The helpers below derive different views from that single array. */
function getAllAppointments()     { return loadJSON(APPTS_KEY, []); }
function saveAllAppointments(arr) { saveJSON(APPTS_KEY, arr); }

/* Returns the appointments belonging to a single user, sorted by date. */
function getUserAppointments(userId) {
    return getAllAppointments()
        .filter(a => a.user_id === userId)
        .sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time));
}

/** Returns the booked time strings ("HH:00") for a specific YYYY-MM-DD date.
 *  Used by the booking modal to disable already-taken time slots. */
function getBookedTimesForDate(dateISO) {
    return getAllAppointments()
        .filter(a => a.appointment_time.startsWith(dateISO))  // ISO "YYYY-MM-DDTHH:MM"
        .map(a => a.appointment_time.slice(11, 16));          // extract "HH:MM"
}

/** Returns every booking in the 7-day window starting at weekStartISO.
 *  Used by the calendar view on appointments.html. */
function getWeekBookings(weekStartISO) {
    const start = new Date(weekStartISO + 'T00:00:00');
    const end   = new Date(start);
    end.setDate(end.getDate() + 7);
    return getAllAppointments().filter(a => {
        const d = new Date(a.appointment_time);
        return d >= start && d < end;
    });
}

/* Time-based id keeps records sortable by creation time, and the random
   suffix avoids collisions if two appointments are created in the same ms. */
function generateAppointmentId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

/* ── 5. Validators (shared across forms) ─────────────────────────────────── */
/* These four functions are reused by every form in the project so the
   rules stay consistent. Each one returns a simple boolean — true means
   "valid", false means "show the error". */

/* Name: between 2 and 100 visible characters (after trimming whitespace). */
function validateName(value)     { return value.trim().length >= 2 && value.trim().length <= 100; }

/* Phone: Israeli format — exactly 10 digits, must start with 0.
   We strip dashes/spaces first so "050-123-4567" is treated like "0501234567". */
function validatePhone(value)    { return /^0\d{9}$/.test(value.replace(/[-\s]/g, '')); }

/* Email: minimal "something@something.something" regex.
   We don't try to be strict — RFC-correct validation is huge and unnecessary
   for a course project; the user will get a real error on first send if it's wrong. */
function validateEmail(value)    { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }

/* Password: at least 6 characters (matches the user-facing hint on the form). */
function validatePassword(value) { return value.length >= 6; }

/** Toggles Bootstrap's is-valid / is-invalid classes on an <input>.
 *  When the input is empty, both classes are removed so we don't show a
 *  red border on a field the user hasn't typed in yet. */
function markField(input, isValid) {
    if (!input.value) {
        input.classList.remove('is-valid', 'is-invalid');
        return;
    }
    input.classList.toggle('is-valid', isValid);
    input.classList.toggle('is-invalid', !isValid);
}

/* ── 6. SVG Tree Logo ────────────────────────────────────────────────────── */
/* Inline SVG so the logo scales perfectly at any size and doesn't need an
   extra HTTP request. Used by both the navbar (small) and the footer (larger).
   The size parameter sets both width and height in pixels. */
function getTreeLogoSVG(size = 40) {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100" aria-label="Integration Center Logo">
        <rect x="44" y="58" width="12" height="28" rx="3" fill="#8B6914"/>
        <rect x="46" y="58" width="4" height="28" rx="1" fill="#A07D1A" opacity="0.5"/>
        <line x1="44" y1="86" x2="35" y2="92" stroke="#8B6914" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="56" y1="86" x2="65" y2="92" stroke="#8B6914" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="50" y1="86" x2="50" y2="94" stroke="#8B6914" stroke-width="2" stroke-linecap="round"/>
        <circle cx="38" cy="38" r="23" fill="#27AE60" opacity="0.8"/>
        <circle cx="62" cy="38" r="23" fill="#2ECC71" opacity="0.8"/>
        <circle cx="50" cy="22" r="23" fill="#1ABC9C" opacity="0.8"/>
        <circle cx="44" cy="18" r="4" fill="rgba(255,255,255,0.25)"/>
        <circle cx="56" cy="30" r="3" fill="rgba(255,255,255,0.2)"/>
    </svg>`;
}

/* ── Navbar ──────────────────────────────────────────────────────────────── */
/* Builds the navbar once per page, injects it at the top of <body>.
   Behaviour:
     - The link matching the current page gets an "active" class for highlighting.
     - The Treatments item is a Bootstrap dropdown that lists every treatment
       so the user can jump straight to any detail page from anywhere.
     - When a user is signed in, two extra links appear ("My appointments",
       "Book appointment") + a logout button replaces the login button. */
function injectNavbar() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const user = getCurrentUser();

    // The "תחומי טיפול" item should stay highlighted on both the overview page
    // AND any individual treatment detail page.
    const isOnTreatmentsPage = currentPage === 'treatments.html'
                            || currentPage === 'treatment-detail.html';

    // Two simple links that bracket the dropdown
    const homeLink = `
        <li class="nav-item">
            <a class="nav-link ${currentPage === 'index.html' ? 'active' : ''}" href="index.html">דף הבית</a>
        </li>`;
    const contactLink = `
        <li class="nav-item">
            <a class="nav-link ${currentPage === 'contact.html' ? 'active' : ''}" href="contact.html">צור קשר</a>
        </li>`;

    // Treatments dropdown — built dynamically from the shared TREATMENTS array.
    // TREATMENTS is a global from js/treatments.js, which is loaded before this
    // file in every HTML page. The typeof check guards against any odd order.
    const treatmentItems = (typeof TREATMENTS !== 'undefined' ? TREATMENTS : [])
        .map(t => `
            <li>
                <a class="dropdown-item" href="treatment-detail.html?type=${t.slug}">
                    <span class="me-2">${t.icon}</span>${t.name}
                </a>
            </li>`)
        .join('');

    const treatmentsDropdown = `
        <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle ${isOnTreatmentsPage ? 'active' : ''}"
               href="treatments.html" role="button"
               data-bs-toggle="dropdown" aria-expanded="false">
                תחומי טיפול
            </a>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item dropdown-item-all" href="treatments.html">כל התחומים ›</a></li>
                ${treatmentItems}
            </ul>
        </li>`;

    // Extra links visible only after the visitor has registered or signed in.
    // These point to the personal area (My Appointments) and the booking calendar.
    const authLinksHTML = user ? `
        <li class="nav-item">
            <a class="nav-link ${currentPage === 'dashboard.html' ? 'active' : ''}" href="dashboard.html">התורים שלי</a>
        </li>
        <li class="nav-item">
            <a class="nav-link ${currentPage === 'appointments.html' ? 'active' : ''}" href="appointments.html">קביעת תור</a>
        </li>` : '';

    // Order: דף הבית → תחומי טיפול (dropdown) → צור קשר → (auth-only links)
    const linksHTML = homeLink + treatmentsDropdown + contactLink + authLinksHTML;

    const firstName = user ? user.full_name.split(' ')[0] : '';
    const authArea = user
        ? `<div class="d-flex align-items-center gap-2 ms-auto">
                <span class="text-light d-none d-md-inline">שלום, <strong>${firstName}</strong></span>
                <button id="logoutBtn" class="btn btn-sm btn-outline-light">יציאה</button>
            </div>`
        : `<div class="ms-auto">
                <a href="auth.html" class="btn btn-sm btn-accent">התחברות / הרשמה</a>
            </div>`;

    const nav = document.createElement('nav');
    nav.className = 'navbar navbar-expand-lg navbar-dark sticky-top';
    nav.innerHTML = `
        <div class="container">
            <a class="navbar-brand d-flex align-items-center gap-2" href="index.html">
                ${getTreeLogoSVG(42)}
                <span>מכון אינטגרציה</span>
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav"
                    aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="mainNav">
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                    ${linksHTML}
                </ul>
                ${authArea}
            </div>
        </div>`;
    document.body.prepend(nav);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
}

/* ── Footer ──────────────────────────────────────────────────────────────── */
/* The footer is identical on every page, so we build it once here and
   append it to the bottom of <body>. Contains the logo, the clinic name,
   social-media icons (placeholder #), and a copyright line. */
function injectFooter() {
    const footer = document.createElement('footer');
    footer.className = 'text-center';
    footer.innerHTML = `
        <div class="container">
            <div class="mb-3">${getTreeLogoSVG(55)}</div>
            <h5 class="mb-2">מכון אינטגרציה</h5>
            <p class="mb-3 opacity-75">דותן בר-נתן | פסיכולוג קליני מומחה</p>
            <div class="social-icons mb-3">
                <a href="#" aria-label="Facebook">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" aria-label="Instagram">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="#" aria-label="LinkedIn">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="#" aria-label="Phone">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                </a>
            </div>
            <hr class="border-secondary opacity-25">
            <p class="mb-0 opacity-50"><small>&copy; 2026 מכון אינטגרציה | כל הזכויות שמורות</small></p>
        </div>`;
    document.body.appendChild(footer);
}

/* ── 7. Loading Spinner ──────────────────────────────────────────────────── */
/* Full-screen semi-transparent overlay with a spinning circle. Used when
   we want to block the UI for a moment (e.g. while the registration form
   is "processing"). showLoading/hideLoading toggle a CSS class. */
function createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = '<div class="spinner-custom"></div>';
    document.body.appendChild(overlay);
}
function showLoading() { document.getElementById('loadingOverlay')?.classList.add('active'); }
function hideLoading() { document.getElementById('loadingOverlay')?.classList.remove('active'); }

/* ── 8. Fade-in on scroll ────────────────────────────────────────────────── */
/* Any element with the class "fade-in" starts invisible (CSS) and fades
   in once it scrolls into view. We use IntersectionObserver — a modern
   browser API — to detect when an element enters the viewport. */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });   // Trigger when 10% of the element is on screen
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

/* ── Toast Notification ──────────────────────────────────────────────────── */
/* Quick floating message at the top of the screen. Used for success/error
   feedback (e.g. "Appointment booked"). Fades out after 3 seconds. */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'error' ? 'danger' : type} position-fixed shadow-lg`;
    toast.style.cssText = 'top: 80px; left: 50%; transform: translateX(-50%); z-index: 9999; min-width: 300px; text-align: center; opacity: 0; transition: opacity 0.3s ease;';
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.style.opacity = '1');
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* ── 9. Date Helpers (used by appointments + dashboard) ──────────────────── */

/* Format a Date object as "YYYY-MM-DD" (the format an <input type="date"> uses). */
function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/* Format an ISO date-string as a friendly Hebrew sentence,
   e.g. "יום שלישי, 14 במאי 2026" — for display in appointment cards. */
function formatDateHebrew(dateStr) {
    return new Date(dateStr).toLocaleDateString('he-IL',
        { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/* Format just the hour out of an ISO datetime, padded ("08:00", "15:00"). */
function formatTime(dateStr) {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, '0')}:00`;
}

/* ── Page bootstrap — runs once on every page ────────────────────────────── */
/* DOMContentLoaded fires when the HTML has finished parsing. We inject the
   navbar, footer, the loading overlay, and start the scroll-fade observer.
   Page-specific JS files (auth.js, appointments.js, etc.) register their
   own DOMContentLoaded listeners, so they all run in registration order. */
document.addEventListener('DOMContentLoaded', () => {
    injectNavbar();
    injectFooter();
    createLoadingOverlay();
    initScrollAnimations();
});
