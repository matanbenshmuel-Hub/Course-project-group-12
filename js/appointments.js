/* =========================================================================
   appointments.js — controls appointments.html (the booking page).

   What the user sees on this page:
     1. A 7-day calendar grid (Sun-Sat × 12 hours/day).
     2. Prev/Next week buttons to navigate other weeks.
     3. A "קביעת תור חדש" button (also: clicking any free cell) opens a
        modal with a form to actually book the slot.

   Cell states in the calendar:
     - empty + future       → "available" (clickable, green hover)
     - booked by someone    → "תפוס" (red, not clickable)
     - booked by ME         → my treatment name (green, with my-booking border)
     - empty + past         → blank (can't book in the past)

   Data flow:
     getAllAppointments()  → read all bookings from localStorage
     handleBooking() form  → push a new appointment + save back to localStorage
     renderWeek()          → re-paint the grid using the fresh data
   ========================================================================= */

/* All possible treatment types — populated into the <select> dropdown.
   Kept in sync with the TREATMENTS data in js/treatments.js. */
const TREATMENT_TYPES = [
    'טיפול נפשי', 'חרדת בחינות', 'פוסט טראומה', 'טיפול ב-OCD',
    'חרדה חברתית', 'סכמה תרפיה', 'חרדה', 'CBT',
    'דיכאון', 'העצמה אישית', 'דמיון מודרך', 'אבחון פסיכולוגי',
    'זוגיות', 'מיינדפולנס', 'טיפול קצר מועד', 'פסיכותרפיה',
    'טיפול פסיכולוגי', 'פיתוח מנהלים', 'טיפול במצבי משבר',
    'טיפול במצבי אבל ושכול'
];

/* Hebrew day names (index 0 = Sunday, matches Date.getDay()). */
const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

/* Working hours: 08:00 – 19:00 (HOURS_END is exclusive). */
const HOURS_START = 8;
const HOURS_END   = 20;

/* Module-level state. currentUser is set on DOMContentLoaded;
   currentWeekStart is the Sunday whose week is currently shown. */
let currentUser     = null;
let currentWeekStart = null;

/* ── Date Helpers (page-specific) ────────────────────────────────────────── */

/* "Now" in Israel local time. We re-construct the Date through a locale
   string so that the calculation is always Asia/Jerusalem regardless of
   the user's actual time zone. */
function getIsraelNow() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
}

/* For any date, return the Sunday at 00:00 of the same week. */
function getSundayOfWeek(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());     // getDay() is 0 for Sunday
    d.setHours(0, 0, 0, 0);                  // strip the time component
    return d;
}

/* Add (or subtract) a number of days, without mutating the original date. */
function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

/* "14/5" — used in calendar headers and the week label. */
function formatDateShort(date)  { return `${date.getDate()}/${date.getMonth() + 1}`; }

/* "14/5 - 20/5" — the title above the calendar showing the displayed week. */
function formatWeekLabel(start) { return `${formatDateShort(start)} - ${formatDateShort(addDays(start, 6))}`; }

/** Combines a YYYY-MM-DD date string + HH:MM time string into an ISO datetime
 *  like "2026-05-14T10:00:00". Used as the unique key for an appointment slot. */
function buildAppointmentTime(dateISO, timeStr) {
    return `${dateISO}T${timeStr}:00`;
}

/* ── Init — runs after the DOM is parsed ─────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    /* requireAuth() gives us either the logged-in user OR auto-seeds a guest.
       Either way, we get a valid object to attribute appointments to. */
    currentUser = requireAuth();
    if (!currentUser) return;

    /* Start the calendar at this week's Sunday. */
    currentWeekStart = getSundayOfWeek(getIsraelNow());

    /* Week navigation buttons */
    document.getElementById('prevWeek').addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, -7);
        renderWeek();
    });
    document.getElementById('nextWeek').addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, 7);
        renderWeek();
    });

    /* Booking form submit + the date <input> change handler that refreshes
       the time dropdown to disable already-taken hours. */
    document.getElementById('bookingForm').addEventListener('submit', handleBooking);
    document.getElementById('appointmentDate').addEventListener('change', refreshTimeSlots);

    /* "קביעת תור חדש" button — clears the form and pre-fills with tomorrow. */
    document.getElementById('openBookingBtn').addEventListener('click', () => {
        document.getElementById('bookingForm').reset();
        document.getElementById('bookingError').classList.add('d-none');
        const tomorrow = addDays(getIsraelNow(), 1);
        document.getElementById('appointmentDate').min   = formatDateISO(tomorrow);
        document.getElementById('appointmentDate').value = formatDateISO(tomorrow);
        populateTimeSelect();
        refreshTimeSlots();
    });

    /* First-time setup of the modal selects + initial calendar paint. */
    populateTreatmentSelect();
    populateTimeSelect();
    setMinDate();
    renderWeek();
});

/* ── Populate the modal's <select> elements ──────────────────────────────── */

/* Treatment-type dropdown — one <option> per entry in TREATMENT_TYPES. */
function populateTreatmentSelect() {
    const select = document.getElementById('treatmentType');
    TREATMENT_TYPES.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        select.appendChild(opt);
    });
}

/* Time dropdown — one <option> per working hour. The empty first option
   keeps the user from accidentally submitting without picking a time. */
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

/* Lock the date <input> so the user can't pick today or earlier
   (booking must be in the future). */
function setMinDate() {
    document.getElementById('appointmentDate').min = formatDateISO(addDays(getIsraelNow(), 1));
}

/* ── Disable already-booked time slots in the modal ──────────────────────── */
/* Called whenever the user changes the date. Rebuilds the time dropdown
   so it reflects which hours are still free for the chosen date. Taken
   slots get appended with " (תפוס)" and disabled. */
function refreshTimeSlots() {
    const date = document.getElementById('appointmentDate').value;
    if (!date) return;

    const select = document.getElementById('appointmentTime');
    const previousValue = select.value;
    populateTimeSelect();

    const booked = getBookedTimesForDate(date);
    Array.from(select.options).forEach(opt => {
        if (booked.includes(opt.value)) {
            opt.disabled = true;
            opt.textContent = `${opt.value} (תפוס)`;
        }
    });
    select.value = booked.includes(previousValue) ? '' : previousValue;
}

/* ── Calendar rendering ──────────────────────────────────────────────────── */
/* Wipes the calendar grid and rebuilds it for currentWeekStart.
   Grid layout (CSS):
     - First row    : "" cell + 7 day-headers (ראשון–שבת + date)
     - Subsequent   : time-cell on the right + 7 day-cells across
   For every day×hour cell we decide which state it's in: booked-by-me,
   booked-by-other, available, or past-empty. */
function renderWeek() {
    document.getElementById('weekLabel').textContent = formatWeekLabel(currentWeekStart);

    /* Read fresh data from localStorage each render so the UI never lags
       behind a booking made in another tab/window. */
    const weekBookings = getWeekBookings(formatDateISO(currentWeekStart));

    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';   // start with an empty grid

    /* Row 1: empty corner + 7 day headers */
    grid.appendChild(buildHeaderCell(''));
    for (let d = 0; d < 7; d++) {
        const dayDate = addDays(currentWeekStart, d);
        const cell = buildHeaderCell(`${DAYS_HE[d]}<br><small>${formatDateShort(dayDate)}</small>`);
        grid.appendChild(cell);
    }

    const israelNow = getIsraelNow();

    /* One row per hour, one cell per day-of-week within the row. */
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

            /* Is there an appointment in this exact slot? */
            const booking = findBooking(weekBookings, dayDate, h);
            if (booking) {
                /* Booked. Style differently depending on whose it is. */
                const isMine = booking.user_id === currentUser.id;
                cell.className += isMine ? ' my-booking' : ' booked';
                cell.innerHTML = `<small>${isMine ? booking.treatment_type : 'תפוס'}</small>`;
            } else if (slotDate > israelNow) {
                /* Free + in the future → clickable. */
                cell.className += ' available';
                cell.addEventListener('click', () => openBookingForSlot(dayDate, h));
            }
            /* Otherwise: free but in the past → stays blank, not clickable. */

            grid.appendChild(cell);
        }
    }
}

/* Small helper for the calendar's top row (day headers). */
function buildHeaderCell(html) {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell day-header';
    cell.innerHTML = html;
    return cell;
}

/* Looks up the booking (if any) at a given day + hour. We compare
   year/month/date/hour individually because comparing Date objects with
   === checks identity, not the moment they represent. */
function findBooking(weekBookings, date, hour) {
    return weekBookings.find(b => {
        const d = new Date(b.appointment_time);
        return d.getFullYear() === date.getFullYear()
            && d.getMonth()    === date.getMonth()
            && d.getDate()     === date.getDate()
            && d.getHours()    === hour;
    });
}

/* ── Open booking modal pre-filled for a calendar cell ───────────────────── */
/* When the user clicks an "available" cell, we open the booking modal with
   the date and hour already filled in, so they only need to choose treatment
   type, location, and (optionally) notes. */
function openBookingForSlot(date, hour) {
    document.getElementById('bookingForm').reset();
    document.getElementById('bookingError').classList.add('d-none');
    const dateISO = formatDateISO(date);
    document.getElementById('appointmentDate').min   = formatDateISO(getIsraelNow());
    document.getElementById('appointmentDate').value = dateISO;
    populateTimeSelect();
    refreshTimeSlots();
    document.getElementById('appointmentTime').value = `${String(hour).padStart(2, '0')}:00`;
    new bootstrap.Modal(document.getElementById('bookingModal')).show();
}

/* ── Booking submit handler ──────────────────────────────────────────────── */
/* Three validations run, in order:
     1. Every required field has a value (treatment, location, date, time).
     2. The chosen date/time is in the future.
     3. No other appointment is already at the same slot.
   Only then do we build the appointment record and save it. */
function handleBooking(e) {
    e.preventDefault();
    const errorBox = document.getElementById('bookingError');
    errorBox.classList.add('d-none');

    /* Read all the form values up front. */
    const treatment_type   = document.getElementById('treatmentType').value;
    const therapist_name   = document.getElementById('therapistName').value;
    const location         = document.getElementById('location').value;
    const appointment_date = document.getElementById('appointmentDate').value;
    const appointment_time = document.getElementById('appointmentTime').value;
    const notes            = document.getElementById('notes').value.trim();

    /* Validation #1 — every required field filled */
    if (!treatment_type || !location || !appointment_date || !appointment_time) {
        return showBookingError('נא למלא את כל שדות החובה');
    }

    /* Validation #2 — date+time must be in the future */
    const slotDateTime = new Date(buildAppointmentTime(appointment_date, appointment_time));
    if (slotDateTime <= getIsraelNow()) {
        return showBookingError('יש לבחור תאריך ושעה עתידיים');
    }

    /* Validation #3 — slot not already booked.
       We compare on the exact ISO string ("YYYY-MM-DDTHH:00:00"). */
    const all = getAllAppointments();
    const conflict = all.find(a =>
        a.appointment_time === buildAppointmentTime(appointment_date, appointment_time)
    );
    if (conflict) {
        return showBookingError('המשבצת תפוסה. אנא בחרו שעה אחרת.');
    }

    /* Spinner on the button while we "process". */
    const btn = document.getElementById('bookBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>קובע תור...';

    setTimeout(() => {
        /* Build the new appointment record and append to the array. */
        const newAppointment = {
            id:               generateAppointmentId(),
            user_id:          currentUser.id,
            full_name:        currentUser.full_name,
            therapist_name,
            location,
            appointment_time: buildAppointmentTime(appointment_date, appointment_time),
            treatment_type,
            notes,
            created_at:       new Date().toISOString()
        };
        all.push(newAppointment);
        saveAllAppointments(all);

        /* Close the modal, celebrate with a toast, repaint the calendar. */
        bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
        showToast('התור נקבע בהצלחה!', 'success');
        renderWeek();

        btn.disabled = false;
        btn.innerHTML = 'אישור תור';
    }, 200);
}

function showBookingError(msg) {
    const errorBox = document.getElementById('bookingError');
    errorBox.textContent = msg;
    errorBox.classList.remove('d-none');
    const btn = document.getElementById('bookBtn');
    btn.disabled = false;
    btn.innerHTML = 'אישור תור';
}
