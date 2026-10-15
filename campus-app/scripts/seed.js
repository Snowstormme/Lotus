const db = require('../server/db');

db.exec(`
DELETE FROM availability_slots;
DELETE FROM enrollments;
DELETE FROM classes;
DELETE FROM deadlines;
DELETE FROM course_files;
DELETE FROM study_plans;
DELETE FROM courses;
DELETE FROM users;
DELETE FROM faculties;
DELETE FROM universities;
`);

db.prepare("INSERT INTO universities (id, name, city) VALUES (1, 'Sample University (demo data)', 'Baku')").run();
db.prepare("INSERT INTO faculties (id, university_id, name) VALUES (1, 1, 'Economics')").run();
db.prepare("INSERT INTO users (id, name, university_id, faculty_id, year, languages, weekly_free_hours, is_demo) VALUES (1, 'Demo Student', 1, 1, 2, 'az,en', 12, 1)").run();
db.prepare("INSERT INTO courses (id, faculty_id, code, name, teacher, room) VALUES (1, 1, 'MATH201', 'Calculus II', 'Sample Teacher', 'B-204')").run();
db.prepare("INSERT INTO enrollments (user_id, course_id, semester) VALUES (1, 1, '2026-fall')").run();
db.prepare("INSERT INTO classes (course_id, weekday, start_time, end_time, room) VALUES (1, 1, '10:00', '11:30', 'B-204')").run();
db.prepare("INSERT INTO deadlines (course_id, title, type, due_at) VALUES (1, 'Problem set 3', 'assignment', date('now', '+5 days'))").run();

console.log('Seed complete: 1 university, 1 faculty, 1 demo user, 1 course, 1 class, 1 deadline.');
