// Appointments page — calendar + booking modal (auth via localStorage).
// Treatment-name list comes from window.TREATMENTS (loaded by /js/treatments.js before this script).

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const HOURS_START = 8;
const HOURS_END = 20;

let currentUser = null;
let currentWeekStart = null;
let weekBookings = [];      // all booked appointments in current week (any user)
let myAppointments = [];    // current user's appointments

// ── Helpers ────────────────────────────────────────────────────────────────
function getIsraelNow() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
}

function getSundayOfWeek(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
}

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function formatDateShort(date) {
    return `${date.getDate()}/${date.getMonth() + 1}`;
}

function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatWeekLabel(start) {
    return `${formatDateShort(start)} - ${formatDateShort(addDays(start, 6))}`;
}

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    currentUser = requireAuth();
    if (!currentUser) return;

    currentWeekStart = getSundayOfWeek(getIsraelNow());

    document.getElementById('prevWeek').addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, -7);
        loadWeek();
    });
    document.getElementById('nextWeek').addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, 7);
        loadWeek();
    });

    document.getElementById('bookingForm').addEventListener('submit', handleBooking);
    document.getElementById('appointmentDate').addEventListener('change', refreshTimeSlots);
    document.getElementById('openBookingBtn').addEventListener('click', () => {
        document.getElementById('bookingForm').reset();
        document.getElementById('bookingError').classList.add('d-none');
        const israelNow = getIsraelNow();
        const tomorrow = addDays(israelNow, 1);
        document.getElementById('appointmentDate').min = formatDateISO(tomorrow);
        document.getElementById('appointmentDate').value = formatDateISO(tomorrow);
        populateTimeSelect();
        refreshTimeSlots();
    });

    populateTreatmentSelect();
    populateTimeSelect();
    setMinDate();
    loadWeek();
    loadMyAppointments();
});

// ── Populate selects ───────────────────────────────────────────────────────
function populateTreatmentSelect() {
    const select = document.getElementById('treatmentType');
    (window.TREATMENTS || []).forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.name;
        opt.textContent = t.name;
        select.appendChild(opt);
    });
}

function populateTimeSelect() {
    const select = document.getElementById('appointmentTime');
    select.innerHTML = '<option value="">שעה...</option>';
    for (let h = HOURS_START; h < HOURS_END; h++) {
        const opt = document.createElement('option');
        opt.value = `${String(h).padStart(2, '0')}:00`;
        opt.textContent = `${String(h).padStart(2, '0')}:00`;
        select.appendChild(opt);
    }
}

function setMinDate() {
    const tomorrow = addDays(getIsraelNow(), 1);
    document.getElementById('appointmentDate').min = formatDateISO(tomorrow);
}

// ── Dynamic slots ──────────────────────────────────────────────────────────
async function refreshTimeSlots() {
    const date = document.getElementById('appointmentDate').value;
    if (!date) return;

    const select = document.getElementById('appointmentTime');
    const previousValue = select.value;
    populateTimeSelect();

    try {
        const res = await fetch(`/api/appointments/slots?date=${date}`);
        if (res.ok) {
            const data = await res.json();
            Array.from(select.options).forEach(opt => {
                if (data.booked.includes(opt.value)) {
                    opt.disabled = true;
                    opt.textContent = `${opt.value} (תפוס)`;
                }
            });
            if (data.booked.includes(previousValue)) {
                select.value = '';
            } else {
                select.value = previousValue;
            }
        }
    } catch {}
}

// ── Load week + my appointments ────────────────────────────────────────────
async function loadWeek() {
    document.getElementById('weekLabel').textContent = formatWeekLabel(currentWeekStart);
    showLoading();
    try {
        const res = await fetch(`/api/appointments/booked?week_start=${formatDateISO(currentWeekStart)}`);
        weekBookings = res.ok ? await res.json() : [];
    } catch {
        weekBookings = [];
    }
    hideLoading();
    renderCalendar();
}

async function loadMyAppointments() {
    try {
        const res = await fetch(`/api/appointments?user_id=${currentUser.id}`);
        if (res.ok) {
            myAppointments = await res.json();
            renderCalendar();
        }
    } catch {}
}

// ── Calendar rendering ─────────────────────────────────────────────────────
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    // Header
    const corner = document.createElement('div');
    corner.className = 'calendar-cell day-header';
    grid.appendChild(corner);
    for (let d = 0; d < 7; d++) {
        const dayDate = addDays(currentWeekStart, d);
        const cell = document.createElement('div');
        cell.className = 'calendar-cell day-header';
        cell.innerHTML = `${DAYS_HE[d]}<br><small>${formatDateShort(dayDate)}</small>`;
        grid.appendChild(cell);
    }

    const israelNow = getIsraelNow();

    for (let h = HOURS_START; h < HOURS_END; h++) {
        const timeCell = document.createElement('div');
        timeCell.className = 'calendar-cell time-cell';
        timeCell.textContent = `${String(h).padStart(2, '0')}:00`;
        grid.appendChild(timeCell);

        for (let d = 0; d < 7; d++) {
            const dayDate = addDays(currentWeekStart, d);
            const slotDate = new Date(dayDate);
            slotDate.setHours(h, 0, 0, 0);
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';

            const booking = findBooking(dayDate, h);
            if (booking) {
                const isMine = myAppointments.some(a =>
                    new Date(a.appointment_time).getTime() === slotDate.getTime()
                );
                cell.className += isMine ? ' my-booking' : ' booked';
                cell.innerHTML = `<small>${booking.treatment_type || 'תפוס'}</small>`;
            } else if (slotDate > israelNow) {
                cell.className += ' available';
                cell.addEventListener('click', () => openBookingForSlot(dayDate, h));
            }
            grid.appendChild(cell);
        }
    }
}

function findBooking(date, hour) {
    return weekBookings.find(b => {
        const d = new Date(b.appointment_time);
        return d.getFullYear() === date.getFullYear()
            && d.getMonth() === date.getMonth()
            && d.getDate() === date.getDate()
            && d.getHours() === hour;
    });
}

// ── Booking ────────────────────────────────────────────────────────────────
function openBookingForSlot(date, hour) {
    document.getElementById('bookingForm').reset();
    document.getElementById('bookingError').classList.add('d-none');
    document.getElementById('appointmentDate').min = formatDateISO(addDays(getIsraelNow(), 0));
    document.getElementById('appointmentDate').value = formatDateISO(date);
    populateTimeSelect();
    refreshTimeSlots().then(() => {
        document.getElementById('appointmentTime').value = `${String(hour).padStart(2, '0')}:00`;
    });
    new bootstrap.Modal(document.getElementById('bookingModal')).show();
}

async function handleBooking(e) {
    e.preventDefault();
    const errorBox = document.getElementById('bookingError');
    errorBox.classList.add('d-none');

    const payload = {
        user_id: currentUser.id,
        therapist_name: document.getElementById('therapistName').value,
        location: document.getElementById('location').value,
        appointment_date: document.getElementById('appointmentDate').value,
        appointment_time: document.getElementById('appointmentTime').value,
        treatment_type: document.getElementById('treatmentType').value,
        notes: document.getElementById('notes').value
    };

    let valid = true;
    if (!payload.treatment_type) valid = false;
    if (!payload.location) valid = false;
    if (!payload.appointment_date) valid = false;
    if (!payload.appointment_time) valid = false;
    if (!valid) {
        errorBox.textContent = 'נא למלא את כל שדות החובה';
        errorBox.classList.remove('d-none');
        return;
    }

    const btn = document.getElementById('bookBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>קובע תור...';

    try {
        const res = await fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.status === 201) {
            bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
            showToast(data.message || 'התור נקבע בהצלחה!', 'success');
            loadWeek();
            loadMyAppointments();
        } else {
            errorBox.textContent = (data.errors || ['שגיאה בקביעת התור']).join(', ');
            errorBox.classList.remove('d-none');
        }
    } catch (err) {
        errorBox.textContent = 'שגיאת תקשורת';
        errorBox.classList.remove('d-none');
    }

    btn.disabled = false;
    btn.innerHTML = 'אישור תור';
}
