# Integration Center — מכון אינטגרציה

A static web application for a psychological clinic ("מכון אינטגרציה"). The site is built with HTML, CSS, vanilla JavaScript, and Bootstrap 5 (RTL). All data — registered users, scheduled appointments, and contact messages — is stored in the browser's `localStorage`.

---

## How to Run

1. Open the project folder.
2. Double-click **`index.html`** to open it in a browser (Chrome, Firefox, or Edge).
3. Navigate the site using the navbar at the top.


---

## Project Structure

```
.
├── index.html               # Landing page
├── treatments.html          # Treatments overview (carousel of all 20 areas)
├── treatment-detail.html    # Per-treatment detail page (?type=<slug>)
├── contact.html             # Contact form
├── auth.html                # Login + Register (tabbed)
├── dashboard.html           # "My Appointments" — list, edit, cancel
├── appointments.html        # Weekly booking calendar
├── css/
│   └── style.css            # Single stylesheet, responsive (RWD)
├── js/
│   ├── common.js            # Storage helpers, validators, navbar (with dropdown), footer
│   ├── index.js             # Landing-page interactions (parallax, smart CTAs)
│   ├── treatments.js        # Shared TREATMENTS data + carousel builder
│   ├── treatment-detail.js  # Reads ?type=slug, renders the matched treatment
│   ├── auth.js              # Login + register
│   ├── appointments.js      # Calendar + booking modal
│   ├── dashboard.js         # Edit / cancel appointments
│   └── contact.js           # Contact form
├── images/                  # Static assets (dotan.png, meadow.png, sunset.png)
└── README.md
```

---

## Pages

The site has two groups of pages: **public** pages that anyone can browse, and **personal** pages that show the visitor's own appointments. The personal pages are tied to a user account — to use them with your own data you need to **sign up** first.

| File | Group | Purpose |
|------|-------|---------|
| `index.html` | Public | Hero, About-the-therapist, Treatment Approach, CTA |
| `treatments.html` | Public | Bootstrap carousel listing 20 treatment areas |
| `treatment-detail.html` | Public | Single-treatment detail page (description, treatment method, bibliography). Reads `?type=<slug>` from the URL |
| `contact.html` | Public | Contact form with full client-side validation |
| `auth.html` | Public | Tabbed Login + Registration |
| `dashboard.html` | **Sign-up required** | "My Appointments" — upcoming + history, with **Edit** and **Cancel** modals |
| `appointments.html` | **Sign-up required** | Weekly calendar grid; click an empty cell to open a pre-filled booking modal |

> **Heads-up:** to use `dashboard.html` and `appointments.html` with your own private list of appointments, **register an account on `auth.html` first**. Without an account these pages still open (the site auto-creates a temporary "אורח" / guest identity so the visual review isn't blocked), but everything you book will be saved under the shared guest profile rather than to your own account.

The navbar and footer are injected by `common.js` so they appear identically on every page. The navbar shows extra links ("התורים שלי", "קביעת תור") after a user is signed in.

The **"תחומי טיפול"** navbar item is a Bootstrap dropdown listing all 20 treatments — each link goes to `treatment-detail.html?type=<slug>`. The dropdown is built dynamically from the shared `TREATMENTS` array in `js/treatments.js`, so adding a treatment in one place propagates to the navbar, the carousel on `treatments.html`, and the detail page lookup.

---

## Technology

- **HTML5** semantic markup (RTL Hebrew).
- **Bootstrap 5.3 RTL** for the responsive grid, navbar, modals, carousel, forms, and utility classes.
- **CSS** in a single `style.css` — CSS variables for the color palette, two media queries for responsiveness, plus animations (`@keyframes spin` for the loading overlay, `.fade-in` scroll-reveal, hover transitions on cards and buttons).
- **Vanilla JavaScript** — no frameworks. Logic is split across page-specific files plus a shared `common.js` module.
- **localStorage** — used as a small in-browser data store for users, appointments, the current session, and contact messages.

---

## Authentication

The site uses standard email + password authentication, simulated entirely in the browser. **To get your own personal "My Appointments" area, sign up on `auth.html` first** — without an account you'll be browsing as a temporary guest.

- **Register** (auth.html → Register tab): full name, phone, email, password, password confirm. Duplicate-email check.
- **Login** (auth.html → Login tab): looks up the email/password pair in `localStorage`.
- **Session**: the active user is kept under `integrationCenter_currentUser`.
- **Auth helper**: `requireAuth()` in `common.js` returns the signed-in user, or seeds a temporary "אורח" (guest) identity so the gated pages still render for visual review. Bookings made as a guest are kept under a shared guest profile — they are not migrated into a real account if you register later.
- **Logout**: the button in the navbar clears the session key. Open `auth.html` to sign back in.

---

## Appointment Management

All appointments live in `localStorage` under `integrationCenter_appointments`.

**Booking** (`appointments.html`):
- Weekly calendar with prev/next-week navigation and a date label.
- Available future cells are clickable; click pre-fills the booking modal with that date + time.
- The modal collects treatment type, therapist (fixed), location, date, time, and optional notes.
- The submit handler validates required fields, that the slot is in the future, and that no other appointment occupies the slot.
- Cells already booked by other users show "תפוס" in red; cells booked by the current user show their treatment name in green.

**Editing & Cancelling** (`dashboard.html`):
- Lists upcoming appointments as cards with **Edit** and **Cancel** buttons.
- Past appointments are kept in a collapsible history section.
- The edit modal re-validates against the same booking rules and prevents double-booking.
- The cancel modal asks for confirmation before deleting.

---

## Validations

| Field | Rule |
|-------|------|
| Full name | 2 – 100 characters |
| Phone | Exactly 10 digits, must start with `0` |
| Email | Standard email regex (`x@y.z`) |
| Password | At least 6 characters |
| Password confirm | Must match the password field |
| Contact message | 5 – 2000 characters |
| Booking date/time | Required and must be in the future |
| Booking slot | Cannot already be taken |

Live (per-keystroke) validation marks each field with Bootstrap's green/red states. Submitting a form re-runs the full validation; if anything fails, a red alert appears at the top of the form. Successful actions show a top-of-page toast.

---

## How to Test the System

> The personal pages (`dashboard.html`, `appointments.html`) work best when you sign up first — that way your bookings are saved under your own account. Step 2 below walks through registration.

1. Open `index.html` in a browser.
2. Click **"התחברות / הרשמה"** in the navbar → switch to the **הרשמה** tab.
3. Fill the registration form. Invalid values (phone without leading `0`, short password, mismatched confirm, etc.) trigger inline error messages.
4. Submit valid data — you are signed in and redirected to `dashboard.html` ("התורים שלי").
5. Click **"קביעת תור חדש"** → click any future, empty cell in the calendar → fill the modal → confirm.
6. Return to the dashboard — the new appointment appears under "תורים קרובים".
7. **Edit** an appointment, then **Cancel** another, both via their modals.
8. Click **"יציאה"** to log out, then log back in on `auth.html` with the same email + password — your data is still there.
9. Try the **contact form** at `contact.html` — invalid input shows live validation, valid input shows the success card.
10. Hover the **"תחומי טיפול"** menu in the navbar — a dropdown appears with all 20 treatments. Pick one (e.g. "חרדה") and verify the detail page renders its description, treatment method, and bibliography. The "לקביעת תור בנושא זה" CTA respects auth state (gates through `auth.html` when logged out, links directly to `appointments.html` when logged in).
11. To start over, open DevTools → Application → Local Storage → clear the `integrationCenter_*` keys.

---

## localStorage Keys

| Key | Shape | Written by |
|-----|-------|------------|
| `integrationCenter_users` | `Array<{ id, full_name, phone, email, password, created_at }>` | Registration |
| `integrationCenter_currentUser` | `{ id, full_name, phone, email, created_at }` (no password) | Login / Register |
| `integrationCenter_appointments` | `Array<{ id, user_id, full_name, therapist_name, location, appointment_time, treatment_type, notes, created_at }>` | Booking / Edit |
| `integrationCenter_contactMessages` | `Array<{ id, full_name, email, phone, message, sent_at }>` | Contact form |

All four are inspectable from the browser DevTools (Application → Local Storage).

---

## Working Assumptions

- The clinic's working hours are **08:00 – 19:00**, one slot per hour, Sun–Sat.
- New bookings must be in the future. The minimum date in the booking modal is "tomorrow".
- One slot can host only one appointment globally (across all simulated users).
- Times are interpreted in **Asia/Jerusalem** local time.
- The therapist drop-down is fixed to "דותן בר-נתן" since the clinic is single-therapist.
- Passwords are stored in plain text in `localStorage` — acceptable for a frontend-only educational scope, not for production.
