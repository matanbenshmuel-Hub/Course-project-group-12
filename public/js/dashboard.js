// Dashboard — list, edit, cancel appointments.
// Treatment-name list comes from window.TREATMENTS (loaded by /js/treatments.js before this script).

let currentUser = null;
let appointments = [];
let pendingCancelId = null;

document.addEventListener('DOMContentLoaded', () => {
    currentUser = requireAuth();
    if (!currentUser) return;

    document.getElementById('userName').textContent = currentUser.full_name;
    document.getElementById('welcomeMsg').textContent = `שלום, ${currentUser.full_name}`;

    populateTreatmentSelect();
    populateTimeSelect();

    document.getElementById('editForm').addEventListener('submit', handleEditSubmit);
    document.getElementById('confirmCancelBtn').addEventListener('click', handleConfirmCancel);
    document.getElementById('editDate').addEventListener('change', refreshEditTimeSlots);

    loadAppointments();
});

// ── Helpers ────────────────────────────────────────────────────────────────
function getIsraelNow() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
}

function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatDateHebrew(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(dateStr) {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, '0')}:00`;
}

function populateTreatmentSelect() {
    const select = document.getElementById('editTreatmentType');
    (window.TREATMENTS || []).forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.name;
        opt.textContent = t.name;
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

// ── Data Loading ───────────────────────────────────────────────────────────
async function loadAppointments() {
    showLoading();
    try {
        const res = await fetch(`/api/appointments?user_id=${currentUser.id}`);
        if (res.ok) {
            appointments = await res.json();
            renderAppointments();
        } else {
            showToast('שגיאה בטעינת תורים', 'error');
        }
    } catch (err) {
        showToast('שגיאת תקשורת', 'error');
    }
    hideLoading();
}

function renderAppointments() {
    const now = getIsraelNow();
    const upcoming = appointments.filter(a => new Date(a.appointment_time) > now);
    const past = appointments.filter(a => new Date(a.appointment_time) <= now);

    document.getElementById('appointmentSummary').textContent =
        `${upcoming.length} תורים קרובים | ${past.length} תורים בהיסטוריה`;

    renderUpcoming(upcoming);
    renderPast(past);
}

function renderUpcoming(list) {
    const container = document.getElementById('upcomingList');
    const empty = document.getElementById('upcomingEmpty');
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
                    ${apt.notes ? `<p class="small fst-italic">"${apt.notes}"</p>` : ''}
                    <div class="d-flex gap-2 mt-auto">
                        <button class="btn btn-outline-primary btn-sm flex-grow-1 edit-btn" data-id="${apt.id}">עריכה</button>
                        <button class="btn btn-outline-danger btn-sm flex-grow-1 cancel-btn" data-id="${apt.id}">ביטול</button>
                    </div>
                </div>
            </div>`;
        container.appendChild(col);
    });

    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(Number(btn.dataset.id)));
    });
    container.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => openCancelModal(Number(btn.dataset.id)));
    });
}

function renderPast(list) {
    const container = document.getElementById('pastList');
    const empty = document.getElementById('pastEmpty');
    container.innerHTML = '';

    if (list.length === 0) {
        empty.classList.remove('d-none');
        return;
    }
    empty.classList.add('d-none');

    list.reverse().forEach(apt => {
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

// ── Edit ───────────────────────────────────────────────────────────────────
function openEditModal(id) {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;

    const aptDate = new Date(apt.appointment_time);
    document.getElementById('editAppointmentId').value = apt.id;
    document.getElementById('editTreatmentType').value = apt.treatment_type;
    document.getElementById('editLocation').value = apt.location;
    document.getElementById('editDate').value = formatDateISO(aptDate);
    document.getElementById('editNotes').value = apt.notes || '';
    document.getElementById('editError').classList.add('d-none');

    // Set min date to today
    document.getElementById('editDate').min = formatDateISO(getIsraelNow());

    populateTimeSelect();
    document.getElementById('editTime').value = formatTime(apt.appointment_time);
    refreshEditTimeSlots();

    new bootstrap.Modal(document.getElementById('editModal')).show();
}

async function refreshEditTimeSlots() {
    const date = document.getElementById('editDate').value;
    const currentEditId = Number(document.getElementById('editAppointmentId').value);
    if (!date) return;

    const select = document.getElementById('editTime');
    const previouslySelected = select.value;
    populateTimeSelect();

    try {
        const res = await fetch(`/api/appointments/slots?date=${date}`);
        if (res.ok) {
            const data = await res.json();
            // Find the time of the current appointment (so we don't disable its own slot)
            const currentApt = appointments.find(a => a.id === currentEditId);
            const ownTime = currentApt && formatDateISO(new Date(currentApt.appointment_time)) === date
                ? formatTime(currentApt.appointment_time) : null;

            Array.from(select.options).forEach(opt => {
                if (data.booked.includes(opt.value) && opt.value !== ownTime) {
                    opt.disabled = true;
                    opt.textContent = `${opt.value} (תפוס)`;
                }
            });
        }
    } catch {}

    select.value = previouslySelected;
}

async function handleEditSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editAppointmentId').value;
    const errorBox = document.getElementById('editError');
    errorBox.classList.add('d-none');

    const payload = {
        user_id: currentUser.id,
        therapist_name: document.getElementById('editTherapistName').value,
        location: document.getElementById('editLocation').value,
        appointment_date: document.getElementById('editDate').value,
        appointment_time: document.getElementById('editTime').value,
        treatment_type: document.getElementById('editTreatmentType').value,
        notes: document.getElementById('editNotes').value
    };

    const btn = document.getElementById('saveEditBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>שומר...';

    try {
        const res = await fetch(`/api/appointments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
            showToast('התור עודכן בהצלחה', 'success');
            loadAppointments();
        } else {
            errorBox.textContent = (data.errors || ['שגיאה בעדכון']).join(', ');
            errorBox.classList.remove('d-none');
        }
    } catch (err) {
        errorBox.textContent = 'שגיאת תקשורת';
        errorBox.classList.remove('d-none');
    }

    btn.disabled = false;
    btn.innerHTML = 'שמירת שינויים';
}

// ── Cancel ─────────────────────────────────────────────────────────────────
function openCancelModal(id) {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;
    pendingCancelId = id;
    document.getElementById('cancelDetails').textContent =
        `${apt.treatment_type} - ${formatDateHebrew(apt.appointment_time)} בשעה ${formatTime(apt.appointment_time)}`;
    new bootstrap.Modal(document.getElementById('cancelModal')).show();
}

async function handleConfirmCancel() {
    if (!pendingCancelId) return;
    const btn = document.getElementById('confirmCancelBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>מבטל...';

    try {
        const res = await fetch(`/api/appointments/${pendingCancelId}?user_id=${currentUser.id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('cancelModal')).hide();
            showToast('התור בוטל', 'success');
            loadAppointments();
        } else {
            const data = await res.json();
            showToast(data.error || 'שגיאה בביטול', 'error');
        }
    } catch (err) {
        showToast('שגיאת תקשורת', 'error');
    }

    pendingCancelId = null;
    btn.disabled = false;
    btn.innerHTML = 'כן, בטל את התור';
}
