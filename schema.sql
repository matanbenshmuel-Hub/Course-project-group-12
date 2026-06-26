-- Integration Center — DB schema
-- NOTE: passwords are stored as plain text. This is intentional for the
-- educational scope of this course project (no bcrypt / sessions / JWT).

DROP DATABASE IF EXISTS integration_center;
CREATE DATABASE integration_center CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE integration_center;

CREATE TABLE users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    full_name  VARCHAR(100)  NOT NULL,
    email      VARCHAR(100)  NOT NULL UNIQUE,
    phone      VARCHAR(20)   NOT NULL,
    password   VARCHAR(255)  NOT NULL,
    created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT           NOT NULL,
    therapist_name   VARCHAR(100)  NOT NULL,
    location         VARCHAR(200)  NOT NULL,
    appointment_time DATETIME      NOT NULL,
    treatment_type   VARCHAR(100)  NOT NULL,
    notes            TEXT,
    created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_no_double_book (therapist_name, appointment_time)
);

CREATE TABLE contact_messages (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    full_name  VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL,
    phone      VARCHAR(20),
    message    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
