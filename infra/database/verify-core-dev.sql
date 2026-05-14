-- Quick checks for the SageLMS core development seed.

SELECT 'auth.users' AS table_name, COUNT(*) AS row_count
FROM auth.users
WHERE email IN (
    'admin@sagelms.dev',
    'instructor@sagelms.dev',
    'pending.instructor@sagelms.dev',
    'rejected.instructor@sagelms.dev',
    'student@sagelms.dev',
    'student2@sagelms.dev'
);

SELECT role, instructor_approval_status, is_active, COUNT(*) AS row_count
FROM auth.users
GROUP BY role, instructor_approval_status, is_active
ORDER BY role, instructor_approval_status, is_active;

SELECT email,
       CASE
           WHEN email = 'admin@sagelms.dev'
                THEN password_hash = crypt('Admin123!', password_hash)
           WHEN email LIKE '%.instructor@sagelms.dev' OR email = 'instructor@sagelms.dev'
                THEN password_hash = crypt('Instructor123!', password_hash)
           WHEN email IN ('student@sagelms.dev', 'student2@sagelms.dev')
                THEN password_hash = crypt('Student123!', password_hash)
           ELSE FALSE
       END AS password_matches_seed
FROM auth.users
WHERE email IN (
    'admin@sagelms.dev',
    'instructor@sagelms.dev',
    'pending.instructor@sagelms.dev',
    'rejected.instructor@sagelms.dev',
    'student@sagelms.dev',
    'student2@sagelms.dev'
)
ORDER BY email;

SELECT status, category, COUNT(*) AS row_count
FROM course.courses
GROUP BY status, category
ORDER BY status, category;

SELECT e.status, u.email AS student_email, c.title AS course_title
FROM course.enrollments e
JOIN auth.users u ON u.id = e.student_id
JOIN course.courses c ON c.id = e.course_id
ORDER BY u.email, c.title;

SELECT c.title AS course_title, l.sort_order, l.title AS lesson_title, l.type, l.is_published
FROM content.lessons l
JOIN course.courses c ON c.id = l.course_id
ORDER BY c.title, l.sort_order;
