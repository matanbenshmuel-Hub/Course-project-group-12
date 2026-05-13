/* =========================================================================
   dashboard.js — controls dashboard.html ("התורים שלי" / My Appointments).

   Layout on the page:
     - A summary line: "X תורים קרובים | Y תורים בהיסטוריה"
     - A grid of cards for upcoming appointments — each card has
       "עריכה" and "ביטול" buttons.
     - A collapsible section showing past appointments (read-only).
     - Two Bootstrap modals: the Edit modal (a form) and the Cancel
       confirmation modal.

   This file only ever touches the current user's appointments;
   the helpers in common.js handle the localStorage I/O.
   ========================================================================= */

/* Same treatment list as appointments.js — used to populate the edit modal's
   <select>. Kept in sync between the two files. */
const TREATMENT_TYPES = [
    'טיפול נפשי', 'חרדת בחינות', 'פוסט טראומה', 'טיפול ב-OCD',
    'חרדה חברתית', 'סכמה תרפיה', 'חרדה', 'CBT',
    'דיכאון', 'העצמה אישית', 'דמיון מודרך', 'אבחון פסיכולוגי',
    'זוגיות', 'מיינדפולנס', 'טיפול קצר מועד', 'פסיכותרפיה',
    'טיפול פסיכולוגי', 'פיתוח מנהלים', 'טיפול במצבי משבר',
    'טיפול במצבי אבל ושכול'
];

/* Module state — set when the page loads. */
let currentUser     = null;   // The logged-in (or guest) user
let appointments    = [];     // Filtered to currentUser only
let pendingCancelId = null;   // The id chosen for cancel confirmation

/* ── Init — runs after the DOM is parsed ─────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    /* requireAuth() will silently seed a guest if no real user is logged in. */
    currentUser = requireAuth();
    if (!currentUser) return;

    /* Greet the user by name in the hero and summary sections. */
    document.getElementById('userName').textContent  = currentUser.full_name;
    document.getElementById('welcomeMsg').textContent = `שלום, ${currentUser.full_name}`;

    /* Prepare the edit modal's <select> dropdowns. */
    populateTreatmentSelect();
    populateTimeSelect();

    /* Wire up the modals + the date <input> that refreshes time slots. */
    document.getElementById('editForm').addEventListener('submit', handleEditSubmit);
    document.getElementById('confirmCancelBtn').addEventListener('click', handleConfirmCancel);
    document.getElementById('editDate').addEventListener('change', refreshEditTimeSlots);

    /* Read appointments from localStorage and paint the cards. */
    loadAppointments();
});

/* ── Helpers ─────────────────────────────────────────────────────────────── */

/* "Now" in Asia/Jerusalem — same trick used in appointments.js so timestamps
   line up regardless of the visitor's actual time zone. */
function getIsraelNow() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
}

function populateTreatmentSelect() {
    const select = document.getElementById('editTreatmentType');
    TREATMENT_TYPES.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        select.appendChild(opt);
    });
}
function populateTimeSelect() {
    const select = document.getElementById('editTime');
    select.innerHTML = '';
    for (let h = 8; h < 20; h++) {
        const opt = document.createElement('option');
        opt.value = `${String(h).padStart(2, '0')}:00`;
        opt.textContent = `${String(h).padStart(2, '0')}:00`;
        select.appendChild(opt);
    }
}

/* ── Data loading + rendering ────────────────────────────────────────────── */

/* Pull the current user's appointments from localStorage and paint them. */
function loadAppointments() {
    appointments = getUserAppointments(currentUser.id);
    renderAppointments();
}

/* Split the list into upcoming vs past based on "now", update the summary
   line, and delegate to the two renderers below. */
function renderAppointments() {
    const now = getIsraelNow();
    const upcoming = appointments.filter(a => new Date(a.appointment_time) > now);
    const past     = appointments.filter(a => new Date(a.appointment_time) <= now);

    document.getElementById('appointmentSummary').textContent =
        `${upcoming.length} תורים קרובים | ${past.length} תורים בהיסטוריה`;

    renderUpcoming(upcoming);
    renderPast(past);
}

/* Build one card per upcoming appointment, then wire up the edit/cancel
   buttons inside each card. If the list is empty we show a "no appointments
   yet" message with a link to the booking page. */
function renderUpcoming(list) {
    const container = document.getElementById('upcomingList');
    const empty     = document.getElementById('upcomingEmpty');
    container.innerHTML = '';

    if (list.length === 0) {
        empty.classList.remove('d-none');
        return;
    }
    empty.classList.add('d-none');

    list.forEach(apt => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        col.innerHTML = `
            <div class="card h-100 shadow-sm border-start border-success border-4">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${apt.treatment_type}</h5>
                    <p class="text-muted mb-1"><small>📅 ${formatDateHebrew(apt.appointment_time)}</small></p>
                    <p class="text-muted mb-1"><small>🕒 ${formatTime(apt.appointment_time)}</small></p>
                    <p class="text-muted mb-1"><small>📍 ${apt.location}</small></p>
                    <p class="text-muted mb-3"><small>👨‍⚕️ ${apt.therapist_name}</small></p>
                    ${apt.notes ? `<p class="small fst-italic">"${escapeHTML(apt.notes)}"</p>` : ''}
                    <div class="d-flex gap-2 mt-auto">
                        <button class="btn btn-outline-primary btn-sm flex-grow-1 edit-btn"   data-id="${apt.id}">עריכה</button>
                        <button class="btn btn-outline-danger  btn-sm flex-grow-1 cancel-btn" data-id="${apt.id}">ביטול</button>
                    </div>
                </div>
            </div>`;
        container.appendChild(col);
    });

    /* Attach click handlers to every card's two action buttons.
       data-id carries the appointment id so the handler knows which one. */
    container.querySelectorAll('.edit-btn').forEach(btn =>
        btn.addEventListener('click', () => openEditModal(Number(btn.dataset.id))));
    container.querySelectorAll('.cancel-btn').forEach(btn =>
        btn.addEventListener('click', () => openCancelModal(Number(btn.dataset.id))));
}

/* Build the collapsible history of past appointments. Read-only — no buttons.
   Reversed so the most recent past appointment shows first. */
function renderPast(list) {
    const container = document.getElementById('pastList');
    const empty     = document.getElementById('pastEmpty');
    container.innerHTML = '';

    if (list.length === 0) {
        empty.classList.remove('d-none');
        return;
    }
    empty.classList.add('d-none');

    list.slice().reverse().forEach(apt => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        col.innerHTML = `
            <div class="card h-100 shadow-sm border-start border-secondary border-4 opacity-75">
                <div class="card-body">
                    <h6 class="card-title">${apt.treatment_type}</h6>
                    <p class="text-muted mb-1"><small>📅 ${formatDateHebrew(apt.appointment_time)}</small></p>
                    <p class="text-muted mb-1"><small>🕒 ${formatTime(apt.appointment_time)}</small></p>
                    <p class="text-muted mb-0"><small>📍 ${apt.location}</small></p>
                </div>
            </div>`;
        container.appendChild(col);
    });
}

/* Defensive HTML-escape. The notes field is plain text from the user, and
   we insert it into the card via innerHTML — so if someone typed "<script>"
   into a note, this turns it into harmless visible text. */
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

/* ── Edit flow ───────────────────────────────────────────────────────────── */

/* Find the appointment, pre-fill the edit form with its current values,
   and open the Bootstrap modal. */
function openEditModal(id) {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;

    const aptDate = new Date(apt.appointment_time);
    document.getElementById('editAppointmentId').value = apt.id;
    document.getElementById('editTreatmentType').value = apt.treatment_type;
    document.getElementById('editLocation').value      = apt.location;
    document.getElementById('editDate').value          = formatDateISO(aptDate);
    document.getElementById('editNotes').value         = apt.notes || '';
    document.getElementById('editError').classList.add('d-none');

    document.getElementById('editDate').min = formatDateISO(getIsraelNow());

    populateTimeSelect();
    document.getElementById('editTime').value = formatTime(apt.appointment_time);
    refreshEditTimeSlots();

    new bootstrap.Modal(document.getElementById('editModal')).show();
}

/** Disable already-booked slots in the edit modal — except the slot of the appointment being edited. */
function refreshEditTimeSlots() {
    const date = document.getElementById('editDate').value;
    const editingId = Number(document.getElementById('editAppointmentId').value);
    if (!date) return;

    const select = document.getElementById('editTime');
    const previouslySelected = select.value;
    populateTimeSelect();

    const editingApt = appointments.find(a => a.id === editingId);
    const ownTime = editingApt && formatDateISO(new Date(editingApt.appointment_time)) === date
        ? formatTime(editingApt.appointment_time) : null;

    const booked = getBookedTimesForDate(date);
    Array.from(select.options).forEach(opt => {
        if (booked.includes(opt.value) && opt.value !== ownTime) {
            opt.disabled = true;
            opt.textContent = `${opt.value} (תפוס)`;
        }
    });
    select.value = previouslySelected;
}

/* Edit submit handler — same validations as booking, plus an ownership check. */
function handleEditSubmit(e) {
    e.preventDefault();
    const id = Number(document.getElementById('editAppointmentId').value);
    const errorBox = document.getElementById('editError');
    errorBox.classList.add('d-none');

    const newDate = document.getElementById('editDate').value;
    const newTime = document.getElementById('editTime').value;
    if (!newDate || !newTime) {
        return showEditError('נא לבחור תאריך ושעה');
    }

    const newAppointmentTime = `${newDate}T${newTime}:00`;

    /* Validation #1 — future date/time */
    if (new Date(newAppointmentTime) <= getIsraelNow()) {
        return showEditError('יש לבחור תאריך ושעה עתידיים');
    }

    /* Validation #2 — no conflict with another appointment.
       The a.id !== id check lets us keep the current slot unchanged. */
    const all = getAllAppointments();
    const conflict = all.find(a => a.id !== id && a.appointment_time === newAppointmentTime);
    if (conflict) {
        return showEditError('המשבצת תפוסה. אנא בחרו שעה אחרת.');
    }

    /* Validation #3 — the appointment exists and belongs to me.
       Without this, a user could edit someone else's appointment by
       fiddling with the data-id in DevTools. */
    const idx = all.findIndex(a => a.id === id);
    if (idx === -1) return showEditError('התור לא נמצא');
    if (all[idx].user_id !== currentUser.id) return showEditError('אין הרשאה לערוך תור זה');

    /* Mutate the record in place with the new values, keep the original
       id / user_id / created_at via the spread. */
    all[idx] = {
        ...all[idx],
        therapist_name:   document.getElementById('editTherapistName').value,
        location:         document.getElementById('editLocation').value,
        appointment_time: newAppointmentTime,
        treatment_type:   document.getElementById('editTreatmentType').value,
        notes:            document.getElementById('editNotes').value.trim()
    };
    saveAllAppointments(all);

    /* Close modal, confirm, re-render the cards from fresh storage. */
    bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
    showToast('התור עודכן בהצלחה', 'success');
    loadAppointments();
}

function showEditError(msg) {
    const box = document.getElementById('editError');
    box.textContent = msg;
    box.classList.remove('d-none');
}

/* ── Cancel flow ─────────────────────────────────────────────────────────── */

/* Open the confirmation modal. We stash the id in pendingCancelId so the
   confirm button knows which appointment to delete. The modal text shows
   the appointment details so the user is sure before clicking confirm. */
function openCancelModal(id) {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;
    pendingCancelId = id;
    document.getElementById('cancelDetails').textContent =
        `${apt.treatment_type} - ${formatDateHebrew(apt.appointment_time)} בשעה ${formatTime(apt.appointment_time)}`;
    new bootstrap.Modal(document.getElementById('cancelModal')).show();
}

/* "כן, בטל את התור" was clicked. Verify ownership, remove from the
   appointments array, write back to localStorage. */
function handleConfirmCancel() {
    if (!pendingCancelId) return;
    const all = getAllAppointments();
    const idx = all.findIndex(a => a.id === pendingCancelId);

    /* Defensive check: the appointment exists and belongs to me. */
    if (idx === -1 || all[idx].user_id !== currentUser.id) {
        showToast('שגיאה בביטול', 'error');
        pendingCancelId = null;
        return;
    }
    all.splice(idx, 1);            // remove one element at index idx
    saveAllAppointments(all);

    bootstrap.Modal.getInstance(document.getElementById('cancelModal')).hide();
    showToast('התור בוטל', 'success');
    pendingCancelId = null;
    loadAppointments();
}
