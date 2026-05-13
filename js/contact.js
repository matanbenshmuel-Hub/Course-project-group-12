/* =========================================================================
   contact.js — controls the contact form on contact.html.

   What it does:
     1. Validates the four fields (name, email, optional phone, message)
        on every keystroke + again on submit.
     2. On successful submit, saves the message to localStorage and swaps
        the form for a success card.

   Phone is optional — only validated if the user typed something in.
   The message field has its own length rule (5–2000 chars).
   ========================================================================= */

/* localStorage key for the inbox. Saved as an array of message objects
   so the clinic could later display them on an admin page. */
const CONTACT_KEY = 'integrationCenter_contactMessages';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');
    form.addEventListener('submit', handleSubmit);

    /* Live per-keystroke validation — each field re-runs its validator
       and lights up green/red. Phone is special: empty is OK. */
    document.getElementById('fullName')
        .addEventListener('input', e => markField(e.target, validateName(e.target.value)));
    document.getElementById('email')
        .addEventListener('input', e => markField(e.target, validateEmail(e.target.value)));
    document.getElementById('phone').addEventListener('input', e => {
        if (!e.target.value) {
            /* Phone is optional, so empty = neutral (no green/red). */
            e.target.classList.remove('is-valid', 'is-invalid');
            return;
        }
        markField(e.target, validatePhone(e.target.value));
    });
    document.getElementById('message')
        .addEventListener('input', e => markField(e.target, validateMessage(e.target.value)));

    /* Convenience: if the visitor is already signed in, pre-fill the
       name / email / phone fields with their account info. */
    const user = getCurrentUser();
    if (user) {
        document.getElementById('fullName').value = user.full_name;
        document.getElementById('email').value    = user.email;
        if (user.phone) document.getElementById('phone').value = user.phone;
    }
});

/* ── Page-specific validator (message length) ───────────────────────────── */
/* Message must be between 5 and 2000 characters after trimming whitespace.
   2000 matches the HTML maxlength attribute on the textarea. */
function validateMessage(value) {
    const len = value.trim().length;
    return len >= 5 && len <= 2000;
}

/* ── Submit handler ──────────────────────────────────────────────────────── */
/* Runs every validator one more time on submit (defense in depth — the user
   could have tampered with the field). If everything passes, the message is
   stored to localStorage and we swap the form card out for a success card. */
function handleSubmit(e) {
    e.preventDefault();
    const fullName = document.getElementById('fullName').value;
    const email    = document.getElementById('email').value;
    const phone    = document.getElementById('phone').value.replace(/[-\s]/g, '');
    const message  = document.getElementById('message').value;
    const errorBox = document.getElementById('contactError');
    errorBox.classList.add('d-none');

    let valid = true;
    if (!validateName(fullName))         { markField(document.getElementById('fullName'), false); valid = false; }
    if (!validateEmail(email))           { markField(document.getElementById('email'),    false); valid = false; }
    if (phone && !validatePhone(phone))  { markField(document.getElementById('phone'),    false); valid = false; }
    if (!validateMessage(message))       { markField(document.getElementById('message'),  false); valid = false; }
    if (!valid) {
        errorBox.textContent = 'נא לתקן את השדות המסומנים';
        errorBox.classList.remove('d-none');
        return;
    }

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>שולח...';
    showLoading();

    /* Brief artificial delay so the loading spinner is actually visible. */
    setTimeout(() => {
        const messages = loadJSON(CONTACT_KEY, []);
        messages.push({
            id: Date.now(),
            full_name: fullName.trim(),
            email:     email.trim(),
            phone:     phone || null,           // null instead of "" for cleaner storage
            message:   message.trim(),
            sent_at:   new Date().toISOString()
        });
        saveJSON(CONTACT_KEY, messages);

        /* Hide the form card and show the success card with the green checkmark. */
        hideLoading();
        document.getElementById('formCard').classList.add('d-none');
        document.getElementById('successCard').classList.remove('d-none');
    }, 400);
}
