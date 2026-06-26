// ── Auth Helpers (localStorage-based, educational scope) ──────────────────
const USER_KEY = 'currentUser';

function getCurrentUser() {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function setCurrentUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function logout() {
    localStorage.removeItem(USER_KEY);
    window.location.href = '/index.html';
}

/** Pages that require auth call this on load. Redirects to /auth.html if not logged in. */
function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        const next = encodeURIComponent(window.location.pathname);
        window.location.href = `/auth.html?next=${next}`;
        return null;
    }
    return user;
}

// ── SVG Tree Logo ──────────────────────────────────────────────────────────
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

// ── Navbar ──────────────────────────────────────────────────────────────────
function injectNavbar() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const user = getCurrentUser();

    // "תחומי טיפול" stays highlighted on both the overview page AND the detail page.
    const isOnTreatmentsPage = currentPage === 'treatments.html'
                            || currentPage === 'treatment-detail.html';

    const homeLink = `
        <li class="nav-item">
            <a class="nav-link ${currentPage === 'index.html' ? 'active' : ''}" href="/index.html">דף הבית</a>
        </li>`;

    const contactLink = `
        <li class="nav-item">
            <a class="nav-link ${currentPage === 'contact.html' ? 'active' : ''}" href="/contact.html">צור קשר</a>
        </li>`;

    // Build dropdown items from the shared TREATMENTS array. The icon is shown
    // before each name so users see the same visual cue used on cards.
    const treatmentItems = (typeof TREATMENTS !== 'undefined' ? TREATMENTS : [])
        .map(t => `
            <li>
                <a class="dropdown-item" href="/treatment-detail.html?type=${t.slug}">
                    <span class="me-2">${t.icon}</span>${t.name}
                </a>
            </li>`)
        .join('');

    const treatmentsDropdown = `
        <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle ${isOnTreatmentsPage ? 'active' : ''}"
               href="/treatments.html" role="button"
               data-bs-toggle="dropdown" aria-expanded="false">
                תחומי טיפול
            </a>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item dropdown-item-all" href="/treatments.html">כל התחומים ›</a></li>
                ${treatmentItems}
            </ul>
        </li>`;

    const authLinksHTML = user ? `
        <li class="nav-item">
            <a class="nav-link ${currentPage === 'dashboard.html' ? 'active' : ''}" href="/dashboard.html">התורים שלי</a>
        </li>
        <li class="nav-item">
            <a class="nav-link ${currentPage === 'appointments.html' ? 'active' : ''}" href="/appointments.html">קביעת תור</a>
        </li>` : '';

    // Order: דף הבית → תחומי טיפול (dropdown) → צור קשר → (auth-only links)
    const linksHTML = homeLink + treatmentsDropdown + contactLink + authLinksHTML;

    // Right-side auth area
    const firstName = user ? user.full_name.split(' ')[0] : '';
    const authArea = user
        ? `<div class="d-flex align-items-center gap-2 ms-auto">
                <span class="text-light d-none d-md-inline">שלום, <strong>${firstName}</strong></span>
                <button id="logoutBtn" class="btn btn-sm btn-outline-light">יציאה</button>
            </div>`
        : `<div class="ms-auto">
                <a href="/auth.html" class="btn btn-sm btn-accent">התחברות / הרשמה</a>
            </div>`;

    const nav = document.createElement('nav');
    nav.className = 'navbar navbar-expand-lg navbar-dark sticky-top';
    nav.innerHTML = `
        <div class="container">
            <a class="navbar-brand d-flex align-items-center gap-2" href="/index.html">
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

    // Wire logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
}

// ── Footer ─────────────────────────────────────────────────────────────────
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

// ── Loading Spinner ────────────────────────────────────────────────────────
function createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = '<div class="spinner-custom"></div>';
    document.body.appendChild(overlay);
}

function showLoading() {
    document.getElementById('loadingOverlay')?.classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay')?.classList.remove('active');
}

// ── Fade-in on scroll ──────────────────────────────────────────────────────
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ── Toast Notification ─────────────────────────────────────────────────────
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

// ── Initialize ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    injectNavbar();
    injectFooter();
    createLoadingOverlay();
    initScrollAnimations();
});
