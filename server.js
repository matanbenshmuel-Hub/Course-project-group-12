// Integration Center — Express server + REST API
// Handles user auth, appointments (CRUD), and contact messages
// Database: MySQL with parameterized queries (SQL injection safe)

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// ── Database pool ──────────────────────────────────────────────────────────
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: '+02:00'
});

// ── Treatment types (server-side whitelist) ────────────────────────────────
// The canonical, content-rich list lives in public/js/treatments.js (window.TREATMENTS).
// When you add a treatment, append the Hebrew name to both lists.
const TREATMENT_TYPES = [
    'טיפול נפשי', 'חרדת בחינות', 'פוסט טראומה', 'טיפול ב-OCD',
    'חרדה חברתית', 'סכמה תרפיה', 'חרדה', 'CBT',
    'דיכאון', 'העצמה אישית', 'דמיון מודרך', 'אבחון פסיכולוגי',
    'זוגיות', 'מיינדפולנס', 'טיפול קצר מועד', 'פסיכותרפיה',
    'טיפול פסיכולוגי', 'פיתוח מנהלים', 'טיפול במצבי משבר',
    'טיפול במצבי אבל ושכול'
];

const HOURS_START = 8;
const HOURS_END = 20; // last bookable hour is 19:00

// ── Helpers ────────────────────────────────────────────────────────────────

// Get current time in Israel timezone (for appointment validation)
function getIsraelNow() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
}

// Parse date and time strings into a Date object (YYYY-MM-DD + HH:00)
function parseIsraelDatetime(dateStr, timeStr) {
    return new Date(`${dateStr}T${timeStr}:00`);
}

function validateRegister(body) {
    const errors = [];
    // Validate full name: must be 2-100 characters
    if (!body.full_name || body.full_name.trim().length < 2 || body.full_name.trim().length > 100) {
        errors.push('שם מלא חייב להכיל בין 2 ל-100 תווים');
    }
    // Validate email format using regex
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
        errors.push('כתובת אימייל לא תקינה');
    }
    // Validate phone: must be 10 digits starting with 0 (Israeli format)
    if (!body.phone || !/^0\d{9}$/.test(body.phone.trim())) {
        errors.push('מספר טלפון חייב להכיל 10 ספרות ולהתחיל ב-0');
    }
    // Validate password: minimum 6 characters
    if (!body.password || body.password.length < 6) {
        errors.push('סיסמה חייבת להכיל לפחות 6 תווים');
    }
    return errors;
}

function validateAppointment(body) {
    const errors = [];
    // User ID must be provided and valid
    if (!body.user_id) errors.push('משתמש חסר');
    // Therapist name is required
    if (!body.therapist_name || !body.therapist_name.trim()) errors.push('שם מטפל חסר');
    // Location is required
    if (!body.location || !body.location.trim()) errors.push('מיקום חסר');
    // Date and time are required and must be in the future
    if (!body.appointment_date || !body.appointment_time) {
        errors.push('תאריך ושעה נדרשים');
    } else {
        const dt = parseIsraelDatetime(body.appointment_date, body.appointment_time);
        // Validate date/time format
        if (isNaN(dt.getTime())) {
            errors.push('תאריך או שעה לא תקינים');
        } else if (dt <= getIsraelNow()) {
            // Prevent booking appointments in the past
            errors.push('לא ניתן לקבוע תור בעבר');
        }
    }
    // Treatment type must be from the approved whitelist
    if (!body.treatment_type || !TREATMENT_TYPES.includes(body.treatment_type)) {
        errors.push('סוג טיפול לא תקין');
    }
    return errors;
}

function validateContact(body) {
    const errors = [];
    // Full name is required, minimum 2 characters
    if (!body.full_name || body.full_name.trim().length < 2) errors.push('שם מלא חסר');
    // Email is required and must be valid format
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) errors.push('אימייל לא תקין');
    // Phone is optional but if provided must be valid Israeli format
    if (body.phone && !/^0\d{9}$/.test(body.phone.trim())) errors.push('טלפון לא תקין');
    // Message is required and must be between 5 and 2000 characters
    if (!body.message || body.message.trim().length < 5) errors.push('הודעה קצרה מדי');
    if (body.message && body.message.length > 2000) errors.push('הודעה ארוכה מדי');
    return errors;
}

// ── Auth Routes ────────────────────────────────────────────────────────────
// User registration and login endpoints

// POST /api/auth/register — create user, return user object
app.post('/api/auth/register', async (req, res) => {
    try {
        const errors = validateRegister(req.body);
        if (errors.length > 0) return res.status(400).json({ errors });

        const { full_name, email, phone, password } = req.body;

        // Ensure email uniqueness (prevent duplicate registrations)
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email.trim()]
        );
        if (existing.length > 0) {
            return res.status(409).json({ errors: ['אימייל זה כבר רשום במערכת'] });
        }

        // Insert new user into database
        const [result] = await pool.execute(
            'INSERT INTO users (full_name, email, phone, password) VALUES (?, ?, ?, ?)',
            [full_name.trim(), email.trim(), phone.trim(), password]
        );

        // Fetch created_at timestamp to include in response
        const [createdRows] = await pool.execute(
            'SELECT created_at FROM users WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            user: {
                id: result.insertId,
                full_name: full_name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                created_at: createdRows[0]?.created_at || null
            }
        });
    } catch (err) {
        console.error('POST /api/auth/register error:', err);
        res.status(500).json({ errors: ['שגיאת שרת'] });
    }
});

// POST /api/auth/login — verify email/password and return user object
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ errors: ['יש להזין אימייל וסיסמה'] });
        }

        // Query user by email and password (plain text for educational scope)
        const [rows] = await pool.execute(
            'SELECT id, full_name, email, phone, created_at FROM users WHERE email = ? AND password = ?',
            [email.trim(), password]
        );

        if (rows.length === 0) {
            return res.status(401).json({ errors: ['אימייל או סיסמה שגויים'] });
        }

        res.json({ user: rows[0] });
    } catch (err) {
        console.error('POST /api/auth/login error:', err);
        res.status(500).json({ errors: ['שגיאת שרת'] });
    }
});

// ── Contact Route ──────────────────────────────────────────────────────────

// POST /api/contact — save a contact message to database
app.post('/api/contact', async (req, res) => {
    try {
        const errors = validateContact(req.body);
        if (errors.length > 0) return res.status(400).json({ errors });

        const { full_name, email, phone, message } = req.body;
        // Save contact message (phone is optional)
        await pool.execute(
            'INSERT INTO contact_messages (full_name, email, phone, message) VALUES (?, ?, ?, ?)',
            [full_name.trim(), email.trim(), phone ? phone.trim() : null, message.trim()]
        );
        res.status(201).json({ ok: true, message: 'ההודעה נשלחה בהצלחה' });
    } catch (err) {
        console.error('POST /api/contact error:', err);
        res.status(500).json({ errors: ['שגיאת שרת'] });
    }
});

// ── Appointment Routes ─────────────────────────────────────────────────────
// Full CRUD operations for therapy appointments with conflict prevention

// GET /api/appointments?user_id=X — get user's appointments
app.get('/api/appointments', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: 'משתמש חסר' });

        // Fetch user's appointments with therapist info, ordered by time
        const [rows] = await pool.execute(
            `SELECT a.id, a.user_id, u.full_name, a.therapist_name, a.location,
                    a.appointment_time, a.treatment_type, a.notes, a.created_at
               FROM appointments a
               JOIN users u ON u.id = a.user_id
              WHERE a.user_id = ?
              ORDER BY a.appointment_time`,
            [user_id]
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /api/appointments error:', err);
        res.status(500).json({ error: 'שגיאת שרת' });
    }
});

// GET /api/appointments/booked?week_start=YYYY-MM-DD — fetch all appointments for a week
app.get('/api/appointments/booked', async (req, res) => {
    try {
        const { week_start } = req.query;
        if (!week_start) return res.status(400).json({ error: 'תאריך תחילת שבוע חסר' });

        // Calculate week end (7 days from start)
        const weekEnd = new Date(week_start);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const weekEndStr = weekEnd.toISOString().split('T')[0];

        // Fetch all appointments in the week range
        const [rows] = await pool.execute(
            'SELECT id, user_id, therapist_name, appointment_time, treatment_type FROM appointments WHERE appointment_time >= ? AND appointment_time < ?',
            [week_start, weekEndStr]
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /api/appointments/booked error:', err);
        res.status(500).json({ error: 'שגיאת שרת' });
    }
});

// GET /api/appointments/slots?date=YYYY-MM-DD — booked + available time slots
app.get('/api/appointments/slots', async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: 'תאריך חסר' });

        const startOfDay = `${date} 00:00:00`;
        const endOfDay = `${date} 23:59:59`;

        // Fetch all appointments on this date
        const [rows] = await pool.execute(
            'SELECT appointment_time FROM appointments WHERE appointment_time BETWEEN ? AND ?',
            [startOfDay, endOfDay]
        );

        // Extract booked hours from appointment times
        const booked = rows.map(r => {
            const d = new Date(r.appointment_time);
            return `${String(d.getHours()).padStart(2, '0')}:00`;
        });

        // Generate all available hours (8:00 - 19:00)
        const all = [];
        for (let h = HOURS_START; h < HOURS_END; h++) {
            all.push(`${String(h).padStart(2, '0')}:00`);
        }
        // Calculate available slots (not booked)
        const available = all.filter(t => !booked.includes(t));

        res.json({ booked, available, all });
    } catch (err) {
        console.error('GET /api/appointments/slots error:', err);
        res.status(500).json({ error: 'שגיאת שרת' });
    }
});

// POST /api/appointments — book an appointment
// Uses transactions to prevent double-booking (therapist or user conflicts)
app.post('/api/appointments', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const errors = validateAppointment(req.body);
        if (errors.length > 0) {
            conn.release();
            return res.status(400).json({ errors });
        }

        const { user_id, therapist_name, location, appointment_date, appointment_time, treatment_type, notes } = req.body;
        const datetime = `${appointment_date} ${appointment_time}:00`;

        await conn.beginTransaction();

        // Verify user exists in database
        const [users] = await conn.execute('SELECT id FROM users WHERE id = ?', [user_id]);
        if (users.length === 0) {
            await conn.rollback();
            conn.release();
            return res.status(401).json({ errors: ['משתמש לא נמצא'] });
        }

        // Check for therapist availability (prevent double-booking)
        const [therapistConflict] = await conn.execute(
            'SELECT id FROM appointments WHERE therapist_name = ? AND appointment_time = ?',
            [therapist_name, datetime]
        );
        if (therapistConflict.length > 0) {
            await conn.rollback();
            conn.release();
            return res.status(409).json({ errors: ['המטפל תפוס בשעה זו'] });
        }

        // Check user doesn't already have an appointment at this time
        const [userConflict] = await conn.execute(
            'SELECT id FROM appointments WHERE user_id = ? AND appointment_time = ?',
            [user_id, datetime]
        );
        if (userConflict.length > 0) {
            await conn.rollback();
            conn.release();
            return res.status(409).json({ errors: ['כבר יש לך תור בשעה זו'] });
        }

        // Create the appointment
        const [result] = await conn.execute(
            'INSERT INTO appointments (user_id, therapist_name, location, appointment_time, treatment_type, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, therapist_name, location, datetime, treatment_type, notes || null]
        );

        await conn.commit();
        conn.release();

        res.status(201).json({
            id: result.insertId,
            message: 'התור נקבע בהצלחה!'
        });
    } catch (err) {
        await conn.rollback();
        conn.release();
        console.error('POST /api/appointments error:', err);
        res.status(500).json({ errors: ['שגיאת שרת'] });
    }
});

// PUT /api/appointments/:id — update an appointment (validates ownership)
// Uses transactions to ensure data consistency with conflict checks
app.put('/api/appointments/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { id } = req.params;
        const errors = validateAppointment(req.body);
        if (errors.length > 0) {
            conn.release();
            return res.status(400).json({ errors });
        }

        const { user_id, therapist_name, location, appointment_date, appointment_time, treatment_type, notes } = req.body;
        const datetime = `${appointment_date} ${appointment_time}:00`;

        await conn.beginTransaction();

        // Verify user owns this appointment
        const [existing] = await conn.execute(
            'SELECT user_id FROM appointments WHERE id = ?',
            [id]
        );
        if (existing.length === 0) {
            await conn.rollback();
            conn.release();
            return res.status(404).json({ errors: ['תור לא נמצא'] });
        }
        if (Number(existing[0].user_id) !== Number(user_id)) {
            await conn.rollback();
            conn.release();
            return res.status(403).json({ errors: ['אין הרשאה לערוך תור זה'] });
        }

        // Check therapist availability excluding current appointment
        const [therapistConflict] = await conn.execute(
            'SELECT id FROM appointments WHERE therapist_name = ? AND appointment_time = ? AND id != ?',
            [therapist_name, datetime, id]
        );
        if (therapistConflict.length > 0) {
            await conn.rollback();
            conn.release();
            return res.status(409).json({ errors: ['המטפל תפוס בשעה זו'] });
        }

        // Check user doesn't have another appointment at this time
        const [userConflict] = await conn.execute(
            'SELECT id FROM appointments WHERE user_id = ? AND appointment_time = ? AND id != ?',
            [user_id, datetime, id]
        );
        if (userConflict.length > 0) {
            await conn.rollback();
            conn.release();
            return res.status(409).json({ errors: ['כבר יש לך תור בשעה זו'] });
        }

        // Update the appointment details
        await conn.execute(
            'UPDATE appointments SET therapist_name = ?, location = ?, appointment_time = ?, treatment_type = ?, notes = ? WHERE id = ?',
            [therapist_name, location, datetime, treatment_type, notes || null, id]
        );

        await conn.commit();
        conn.release();

        res.json({ ok: true, message: 'התור עודכן בהצלחה' });
    } catch (err) {
        await conn.rollback();
        conn.release();
        console.error('PUT /api/appointments/:id error:', err);
        res.status(500).json({ errors: ['שגיאת שרת'] });
    }
});

// DELETE /api/appointments/:id?user_id=X — cancel an appointment (validates ownership)
app.delete('/api/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: 'משתמש חסר' });

        // Verify appointment exists and user owns it
        const [existing] = await pool.execute(
            'SELECT user_id FROM appointments WHERE id = ?',
            [id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ error: 'תור לא נמצא' });
        }
        // Prevent users from cancelling other users' appointments
        if (Number(existing[0].user_id) !== Number(user_id)) {
            return res.status(403).json({ error: 'אין הרשאה לבטל תור זה' });
        }

        // Delete the appointment
        await pool.execute('DELETE FROM appointments WHERE id = ?', [id]);
        res.json({ ok: true, message: 'התור בוטל בהצלחה' });
    } catch (err) {
        console.error('DELETE /api/appointments/:id error:', err);
        res.status(500).json({ error: 'שגיאת שרת' });
    }
});

// ── Start server ───────────────────────────────────────────────────────────
// Listen on configured port and serve API + static files

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Integration Center server running on http://localhost:${PORT}`);
});
