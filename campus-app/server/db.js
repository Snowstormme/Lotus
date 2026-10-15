const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'campus.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS universities (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT
);
CREATE TABLE IF NOT EXISTS faculties (
  id INTEGER PRIMARY KEY,
  university_id INTEGER NOT NULL REFERENCES universities(id),
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  university_id INTEGER REFERENCES universities(id),
  faculty_id INTEGER REFERENCES faculties(id),
  year INTEGER,
  languages TEXT,
  weekly_free_hours INTEGER DEFAULT 0,
  is_demo INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY,
  faculty_id INTEGER REFERENCES faculties(id),
  code TEXT,
  name TEXT NOT NULL,
  teacher TEXT,
  room TEXT,
  schedule_text TEXT,
  syllabus TEXT
);
CREATE TABLE IF NOT EXISTS enrollments (
  user_id INTEGER REFERENCES users(id),
  course_id INTEGER REFERENCES courses(id),
  semester TEXT,
  PRIMARY KEY (user_id, course_id)
);
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id),
  weekday INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room TEXT
);
CREATE TABLE IF NOT EXISTS deadlines (
  id INTEGER PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id),
  title TEXT NOT NULL,
  type TEXT,
  due_at TEXT NOT NULL,
  description TEXT
);
CREATE TABLE IF NOT EXISTS availability_slots (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  weekday INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS course_files (
  id INTEGER PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id),
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT
);
CREATE TABLE IF NOT EXISTS study_plans (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  plan_json TEXT NOT NULL,
  source TEXT NOT NULL
);
`);

module.exports = db;
