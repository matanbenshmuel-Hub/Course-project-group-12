// Auth page — login + register

document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, skip auth — go straight to next page
    const existing = getCurrentUser();
    if (existing) {
        const next = new URLSearchParams(window.location.search).get('next') || '/dashboard.html';
        window.location.href = next;
        return;
    }

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);

    // Live validation
    document.getElementById('regName').addEventListener('input', (e) => mark(e.target, validateName(e.target.value)));
    document.getElementById('regPhone').addEventListener('input', (e) => mark(e.target, validatePhone(e.target.value)));
    document.getElementById('regEmail').addEventListener('input', (e) => mark(e.target, validateEmail(e.target.value)));
    document.getElementById('regPassword').addEventListener('input', (e) => mark(e.target, validatePassword(e.target.value)));
    document.getElementById('regPasswordConfirm').addEventListener('input', (e) => {
        const match = e.target.value === document.getElementById('regPassword').value;
        mark(e.target, match && e.target.value.length > 0);
    });
});

// ── Validators ─────────────────────────────────────────────────────────────
function validateName(value) {
    return value.trim().length >= 2 && value.trim().length <= 100;
}
function validatePhone(value) {
    return /^0\d{9}$/.test(value.replace(/[-\s]/g, ''));
}
function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
function validatePassword(value) {
    return value.length >= 6;
}
function mark(input, isValid) {
    if (!input.value) {
        input.classList.remove('is-valid', 'is-invalid');
        return;
    }
    input.classList.toggle('is-valid', isValid);
    input.classList.toggle('is-invalid', !isValid);
}

// ── Login ──────────────────────────────────────────────────────────────────
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorBox = document.getElementById('loginError');
    errorBox.classList.add('d-none');

    if (!validateEmail(email) || !password) {
        errorBox.textContent = 'נא למלא אימייל וסיסמה תקינים';
        errorBox.classList.remove('d-none');
        return;
    }

    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>מתחבר...';
    showLoading();

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        hideLoading();

        if (res.ok) {
            setCurrentUser(data.user);
            const next = new URLSearchParams(window.location.search).get('next') || '/dashboard.html';
            window.location.href = next;
        } else {
            errorBox.textContent = (data.errors || ['שגיאה בהתחברות']).join(', ');
            errorBox.classList.remove('d-none');
        }
    } catch (err) {
        hideLoading();
        errorBox.textContent = 'שגיאת תקשורת';
        errorBox.classList.remove('d-none');
    }

    btn.disabled = false;
    btn.innerHTML = 'התחברות';
}

// ── Register ───────────────────────────────────────────────────────────────
async function handleRegister(e) {
    e.preventDefault();
    const full_name = document.getElementById('regName').value.trim();
    const phone = document.getElementById('regPhone').value.replace(/[-\s]/g, '');
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    const errorBox = document.getElementById('registerError');
    errorBox.classList.add('d-none');

    let valid = true;
    if (!validateName(full_name)) { mark(document.getElementById('regName'), false); valid = false; }
    if (!validatePhone(phone)) { mark(document.getElementById('regPhone'), false); valid = false; }
    if (!validateEmail(email)) { mark(document.getElementById('regEmail'), false); valid = false; }
    if (!validatePassword(password)) { mark(document.getElementById('regPassword'), false); valid = false; }
    if (password !== passwordConfirm) { mark(document.getElementById('regPasswordConfirm'), false); valid = false; }
    if (!valid) {
        errorBox.textContent = 'נא לתקן את השדות המסומנים';
        errorBox.classList.remove('d-none');
        return;
    }

    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>נרשם...';
    showLoading();

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name, phone, email, password })
        });
        const data = await res.json();
        hideLoading();

        if (res.ok) {
            setCurrentUser(data.user);
            showToast('נרשמת בהצלחה!', 'success');
            setTimeout(() => {
                const next = new URLSearchParams(window.location.search).get('next') || '/dashboard.html';
                window.location.href = next;
            }, 600);
        } else {
            errorBox.textContent = (data.errors || ['שגיאה בהרשמה']).join(', ');
            errorBox.classList.remove('d-none');
        }
    } catch (err) {
        hideLoading();
        errorBox.textContent = 'שגיאת תקשורת';
        errorBox.classList.remove('d-none');
    }

    btn.disabled = false;
    btn.innerHTML = 'הרשמה';
}
