/* =========================================================================
   auth.js — controls the Login + Registration card on auth.html.

   The page has two tabs (Bootstrap pills): "התחברות" (login) and
   "הרשמה" (registration). Each is a separate <form>, both handled here:

     - handleLogin    : verifies email + password against the users array
     - handleRegister : validates every field, prevents duplicate email,
                        creates a new user record, signs them in

   All accounts live in localStorage (key "integrationCenter_users"), and
   the currently signed-in user lives under "integrationCenter_currentUser".
   The shared validators (validateName / validatePhone / validateEmail /
   validatePassword) and markField helper come from common.js.
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    /* If a real user is already logged in, send them straight to the page
       they were trying to reach (or to the dashboard). We deliberately do
       NOT redirect "guest" users (those auto-seeded by requireAuth), so
       a guest can still see the registration form and upgrade. */
    const existing = getCurrentUser();
    if (existing && !existing._guest) {
        const next = new URLSearchParams(window.location.search).get('next') || 'dashboard.html';
        window.location.href = next;
        return;
    }

    /* Submit-handlers for the two forms (eventListener #1 and #2) */
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);

    /* Live, per-keystroke validation on the registration fields.
       Each "input" event re-runs the shared validator and lights the
       field green (is-valid) or red (is-invalid). */
    document.getElementById('regName')
        .addEventListener('input', e => markField(e.target, validateName(e.target.value)));
    document.getElementById('regPhone')
        .addEventListener('input', e => markField(e.target, validatePhone(e.target.value)));
    document.getElementById('regEmail')
        .addEventListener('input', e => markField(e.target, validateEmail(e.target.value)));
    document.getElementById('regPassword')
        .addEventListener('input', e => markField(e.target, validatePassword(e.target.value)));
    /* The password-confirm field has its own rule: it must equal the
       password field above it. So we compare the two values directly. */
    document.getElementById('regPasswordConfirm').addEventListener('input', e => {
        const match = e.target.value === document.getElementById('regPassword').value;
        markField(e.target, match && e.target.value.length > 0);
    });
});

/* ── Login submit handler ───────────────────────────────────────────────── */
/* Steps:
     1. Read email + password from the form.
     2. Basic validation — if invalid, show error and stop.
     3. Briefly show a spinner for UX feedback.
     4. Look up the email in the users array; verify the password matches.
     5. If success → store the user (minus password) as the current session,
        then redirect to the original target page (?next=) or the dashboard.
     6. If failure → show the error message and re-enable the button. */
function handleLogin(e) {
    e.preventDefault();                                   // Stop normal form submit
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorBox = document.getElementById('loginError');
    errorBox.classList.add('d-none');                     // Hide previous error message

    /* Cheap up-front check before touching localStorage. */
    if (!validateEmail(email) || !password) {
        showLoginError('נא למלא אימייל וסיסמה תקינים');
        return;
    }

    /* Disable the button + show spinner so the user knows something is happening. */
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>מתחבר...';
    showLoading();

    /* Tiny artificial delay so the spinner is actually visible.
       Without it the lookup is instantaneous and the spinner just flickers. */
    setTimeout(() => {
        const user = findUserByEmail(email);
        hideLoading();

        /* No matching user OR password mismatch → generic error
           (don't reveal which one is wrong, for security hygiene). */
        if (!user || user.password !== password) {
            showLoginError('אימייל או סיסמה שגויים');
            btn.disabled = false;
            btn.innerHTML = 'התחברות';
            return;
        }

        /* Strip the password before storing as the session user. */
        const { password: _, ...safe } = user;
        setCurrentUser(safe);

        /* Honor ?next=... so the user lands back on the page they came from. */
        const next = new URLSearchParams(window.location.search).get('next') || 'dashboard.html';
        window.location.href = next;
    }, 250);
}

/* Helper: show the red alert above the login button. */
function showLoginError(msg) {
    const box = document.getElementById('loginError');
    box.textContent = msg;
    box.classList.remove('d-none');
}

/* ── Register submit handler ────────────────────────────────────────────── */
/* Steps:
     1. Read all 5 fields and trim/clean whitespace where appropriate.
     2. Run every validator. Mark each failing field in red.
     3. If any field is invalid → show the top-level "fix the marked fields" error.
     4. Check the users array for an existing account with the same email
        (case-insensitive). If found, ask them to log in instead.
     5. Briefly show a spinner.
     6. Push the new user to the users array, set them as the current session
        (without the password), and redirect to the next page after a tiny
        delay so the "registered successfully" toast is visible. */
function handleRegister(e) {
    e.preventDefault();
    const full_name       = document.getElementById('regName').value.trim();
    const phone           = document.getElementById('regPhone').value.replace(/[-\s]/g, ''); // strip dashes/spaces
    const email           = document.getElementById('regEmail').value.trim();
    const password        = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    const errorBox        = document.getElementById('registerError');
    errorBox.classList.add('d-none');

    /* Walk every field; collect a single "invalid" flag and visually
       mark each failing input. Order matches the form top-to-bottom. */
    let valid = true;
    if (!validateName(full_name))     { markField(document.getElementById('regName'), false);            valid = false; }
    if (!validatePhone(phone))        { markField(document.getElementById('regPhone'), false);           valid = false; }
    if (!validateEmail(email))        { markField(document.getElementById('regEmail'), false);           valid = false; }
    if (!validatePassword(password))  { markField(document.getElementById('regPassword'), false);        valid = false; }
    if (password !== passwordConfirm) { markField(document.getElementById('regPasswordConfirm'), false); valid = false; }
    if (!valid) {
        showRegisterError('נא לתקן את השדות המסומנים');
        return;
    }

    /* Duplicate email — case-insensitive via findUserByEmail. */
    if (findUserByEmail(email)) {
        showRegisterError('משתמש עם אימייל זה כבר קיים. נסו להתחבר.');
        return;
    }

    /* Disable the button while we "process" the registration. */
    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>נרשם...';
    showLoading();

    setTimeout(() => {
        /* Build the new user record. id = milliseconds since epoch — guaranteed
           unique under normal use and keeps records sortable by creation time. */
        const newUser = {
            id: Date.now(),
            full_name,
            phone,
            email,
            password,                                     // plain text — educational scope only
            created_at: new Date().toISOString()
        };

        /* Append to the users array and write the whole thing back to localStorage. */
        const users = getAllUsers();
        users.push(newUser);
        saveAllUsers(users);

        /* Session user gets the same record without the password field
           (object-spread + destructure pattern strips one key). */
        const { password: _, ...safe } = newUser;
        setCurrentUser(safe);
        hideLoading();

        /* Brief delay so the success toast is actually readable before the redirect. */
        showToast('נרשמת בהצלחה!', 'success');
        setTimeout(() => {
            const next = new URLSearchParams(window.location.search).get('next') || 'dashboard.html';
            window.location.href = next;
        }, 600);
    }, 250);
}

/* Helper: show the red alert above the registration button. */
function showRegisterError(msg) {
    const box = document.getElementById('registerError');
    box.textContent = msg;
    box.classList.remove('d-none');
}
