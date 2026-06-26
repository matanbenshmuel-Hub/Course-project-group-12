// Contact page — sends message to /api/contact

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');
    form.addEventListener('submit', handleSubmit);

    document.getElementById('fullName').addEventListener('input', (e) => mark(e.target, validateName(e.target.value)));
    document.getElementById('email').addEventListener('input', (e) => mark(e.target, validateEmail(e.target.value)));
    document.getElementById('phone').addEventListener('input', (e) => {
        if (!e.target.value) {
            e.target.classList.remove('is-valid', 'is-invalid');
            return;
        }
        mark(e.target, validatePhone(e.target.value));
    });
    document.getElementById('message').addEventListener('input', (e) => mark(e.target, validateMessage(e.target.value)));

    // Pre-fill if logged in
    const user = getCurrentUser();
    if (user) {
        document.getElementById('fullName').value = user.full_name;
        document.getElementById('email').value = user.email;
        if (user.phone) document.getElementById('phone').value = user.phone;
    }
});

// ── Validators ─────────────────────────────────────────────────────────────
function validateName(value) {
    return value.trim().length >= 2 && value.trim().length <= 100;
}
function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
function validatePhone(value) {
    return /^0\d{9}$/.test(value.replace(/[-\s]/g, ''));
}
function validateMessage(value) {
    const len = value.trim().length;
    return len >= 5 && len <= 2000;
}
function mark(input, isValid) {
    if (!input.value) {
        input.classList.remove('is-valid', 'is-invalid');
        return;
    }
    input.classList.toggle('is-valid', isValid);
    input.classList.toggle('is-invalid', !isValid);
}

// ── Submit ─────────────────────────────────────────────────────────────────
async function handleSubmit(e) {
    e.preventDefault();
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value.replace(/[-\s]/g, '');
    const message = document.getElementById('message').value;
    const errorBox = document.getElementById('contactError');
    errorBox.classList.add('d-none');

    let valid = true;
    if (!validateName(fullName)) { mark(document.getElementById('fullName'), false); valid = false; }
    if (!validateEmail(email)) { mark(document.getElementById('email'), false); valid = false; }
    if (phone && !validatePhone(phone)) { mark(document.getElementById('phone'), false); valid = false; }
    if (!validateMessage(message)) { mark(document.getElementById('message'), false); valid = false; }
    if (!valid) {
        errorBox.textContent = 'נא לתקן את השדות המסומנים';
        errorBox.classList.remove('d-none');
        return;
    }

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>שולח...';
    showLoading();

    try {
        const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: fullName.trim(),
                email: email.trim(),
                phone: phone || null,
                message: message.trim()
            })
        });
        const data = await res.json();
        hideLoading();

        if (res.ok) {
            document.getElementById('formCard').classList.add('d-none');
            document.getElementById('successCard').classList.remove('d-none');
        } else {
            errorBox.textContent = (data.errors || ['שגיאה בשליחה']).join(', ');
            errorBox.classList.remove('d-none');
            btn.disabled = false;
            btn.innerHTML = 'שליחת הודעה';
        }
    } catch (err) {
        hideLoading();
        errorBox.textContent = 'שגיאת תקשורת';
        errorBox.classList.remove('d-none');
        btn.disabled = false;
        btn.innerHTML = 'שליחת הודעה';
    }
}
