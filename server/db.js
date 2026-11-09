const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'cloud_testing.db');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    full_name TEXT NOT NULL,
    group_name TEXT NOT NULL,
    variant INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT NOT NULL,
    full_name TEXT NOT NULL,
    group_name TEXT NOT NULL,
    variant INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'completed',
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    time_spent_seconds INTEGER DEFAULT 0,
    total_score INTEGER NOT NULL,
    max_score INTEGER NOT NULL DEFAULT 100,
    section_scores TEXT NOT NULL,
    answers TEXT NOT NULL,
    grading_details TEXT NOT NULL,
    verdict TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
  );
`);

// Try adding column variant if database was created earlier without it
try {
  db.exec(`ALTER TABLE users ADD COLUMN variant INTEGER DEFAULT 1;`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE submissions ADD COLUMN variant INTEGER DEFAULT 1;`);
} catch (e) {}

// Seed default users if not present
const findUser = db.prepare('SELECT * FROM users WHERE username = ?');

if (!findUser.get('admin')) {
  const insertUser = db.prepare(`
    INSERT INTO users (username, password, role, full_name, group_name, variant)
    VALUES (?, ?, ?, ?, ?, 1)
  `);
  insertUser.run('admin', 'admin2027', 'admin', 'Преподаватель-эксперт', 'Экспертное сообщество');
}

if (!findUser.get('student')) {
  const insertUser = db.prepare(`
    INSERT INTO users (username, password, role, full_name, group_name, variant)
    VALUES (?, ?, ?, ?, ?, 1)
  `);
  insertUser.run('student', 'student123', 'student', 'Иванов Алексей Сергеевич', 'ИСП-401');
}

module.exports = db;
