# Integration Center - מכון אינטגרציה

> A full-stack web system for a psychological clinic, built as **Part C** of the BGU "Building WEB-Based Systems" course project (Group 12).

---

## Purpose

The site provides a complete client-facing experience for "Integration Center", a therapy clinic led by Dotan Bar-Natan. Visitors can:

- Browse the clinic's treatment areas and read about the therapist
- Send a contact message
- Register and log in
- Book, view, edit, and cancel therapy appointments through a weekly calendar with dynamic available-slots logic

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js + Express (REST JSON API) |
| Database | MySQL (`mysql2` driver, parameterized queries, transactions) |
| Frontend | Plain HTML5 + Bootstrap 5 RTL + vanilla JavaScript (Fetch API) |
| Templating | None - static HTML, data injected client-side |
| UI Direction | Hebrew, RTL |
| Auth | Email + password validated against MySQL; client persists user in `localStorage` (educational scope - see [Notes](#notes--assumptions)) |

---

## Project Structure

```
.
├── server.js                 # Express server + all API endpoints
├── schema.sql                # MySQL schema (users, appointments, contact_messages)
├── package.json
├── .env                      # DB credentials (not committed)
├── images/                   # Static assets (dotan.png, meadow.png, sunset.png)
└── public/                   # Served statically by Express
    ├── index.html            # Landing page
    ├── treatments.html       # Treatments carousel
    ├── contact.html          # Contact form
    ├── auth.html             # Login + Register
    ├── dashboard.html        # My Appointments (edit/cancel)
    ├── appointments.html     # Booking calendar
    ├── css/
    │   └── style.css
    └── js/
        ├── common.js         # Navbar/footer, auth helpers, toasts, spinner
        ├── index.js
        ├── treatments.js
        ├── contact.js
        ├── auth.js
        ├── dashboard.js
        └── appointments.js
```

---

## Prerequisites

- **Node.js** 18 or later (`node --version`)
- **MySQL** 8 or later - **OR** [XAMPP](https://www.apachefriends.org/) (which bundles MySQL with a one-click installer)
- A modern browser

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/matanbenshmuel-Hub/Course-project-group-12.git
cd Course-project-group-12
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Set up MySQL

You need a MySQL server running locally. Two easy options:

**Option A - XAMPP (recommended on Windows)**
1. Install XAMPP and start the **MySQL** module from the XAMPP Control Panel.
2. Open `http://localhost/phpmyadmin` in your browser.
3. Click the **SQL** tab, paste the contents of [schema.sql](schema.sql), and click **Go**.

**Option B — MySQL CLI**
```bash
mysql -u root -p < schema.sql
```

This creates an `integration_center` database with three tables: `users`, `appointments`, `contact_messages`.

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=        # leave empty if using XAMPP defaults; otherwise your MySQL password
DB_NAME=integration_center
PORT=3000
```

### 5. Start the server

```bash
npm start
```

You should see:

```
Integration Center server running on http://localhost:3000
```

Open `http://localhost:3000` in your browser.

---

## How to Use

1. **Land on the home page** - read about the clinic and Dotan Bar-Natan.
2. **Browse treatments** via the carousel on `/treatments.html`.
3. **Register** via the navbar's "התחברות / הרשמה" button → fill name, phone, email, password.
4. After registering you're redirected to the **Dashboard** (`/dashboard.html`).
5. Click **"קביעת תור חדש"** → calendar view. Click any green (available) slot to open the booking modal.
6. Pick a treatment type, location, date and time, then submit. The booking shows up in your dashboard.
7. From the dashboard you can **Edit** or **Cancel** any upcoming appointment. Past appointments are listed read-only in a collapsible section.
8. Use **"יציאה"** in the navbar to log out (clears `localStorage`).

---

## Features

- Email + password registration and login
- Six fully-linked HTML pages (home, treatments, contact, auth, dashboard, appointments)
- Bootstrap 5 RTL responsive layout (mobile-first breakpoints at 991px / 767px)
- Weekly calendar with **dynamic available-slots** logic (booked times disabled in the time picker)
- Edit and cancel appointments with ownership validation
- Double-booking prevention at both DB level (unique index) and application level (transactions)
- Israel timezone-aware date handling (`Asia/Jerusalem`)
- Hebrew form validation with live feedback (Bootstrap `is-valid` / `is-invalid`)
- Inline-SVG tree logo in header & footer
- Atmospheric blurred background images, with the therapist portrait kept sharp
- Loading spinner, toast notifications, fade-in scroll animations

---

## Notes & Assumptions

- **Passwords are stored as plain text** in MySQL. This is an explicit course-project simplification and **must not be used in production**. In a real system, use `bcrypt`.
- **Auth state lives in `localStorage`** under the key `currentUser` as `{id, full_name, email, phone}`. There is no server-side session; protected endpoints accept `user_id` as a request parameter and the server trusts it. Again, educational scope only.
- **Timezone:** all server-side date math uses Israel local time (`Asia/Jerusalem`).
- **All UI copy is in Hebrew (RTL).** Code, identifiers, and comments are in English.
- **Therapist:** the system currently has one therapist (Dotan Bar-Natan); the schema allows extending to many.

---

## Course Info

- **Course:** Building WEB-Based Systems
- **Institution:** Ben-Gurion University of the Negev
- **Project:** Final Project - Part C (Server Side)
- **Group:** 12
