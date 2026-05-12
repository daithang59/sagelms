-- Quick checks for the SageLMS core development seed.

SELECT 'auth.users' AS table_name, COUNT(*) AS row_count
FROM auth.users
WHERE email IN (
    'admin@sagelms.dev',
    'instructor@sagelms.dev',
    'frontend.instructor@sagelms.dev',
    'data.instructor@sagelms.dev',
    'devops.instructor@sagelms.dev',
    'product.instructor@sagelms.dev',
    'pending.instructor@sagelms.dev',
    'rejected.instructor@sagelms.dev',
    'student@sagelms.dev',
    'student2@sagelms.dev',
    'student3@sagelms.dev',
    'student4@sagelms.dev'
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
           WHEN email LIKE 'student%@sagelms.dev'
                THEN password_hash = crypt('Student123!', password_hash)
           ELSE FALSE
       END AS password_matches_seed
FROM auth.users
WHERE email IN (
    'admin@sagelms.dev',
    'instructor@sagelms.dev',
    'frontend.instructor@sagelms.dev',
    'data.instructor@sagelms.dev',
    'devops.instructor@sagelms.dev',
    'product.instructor@sagelms.dev',
    'pending.instructor@sagelms.dev',
    'rejected.instructor@sagelms.dev',
    'student@sagelms.dev',
    'student2@sagelms.dev',
    'student3@sagelms.dev',
    'student4@sagelms.dev'
)
ORDER BY email;

SELECT status, category, COUNT(*) AS row_count
FROM course.courses
GROUP BY status, category
ORDER BY status, category;

SELECT 'seed_courses' AS check_name,
       COUNT(*) AS actual_count,
       28 AS expected_count
FROM course.courses
WHERE id::text LIKE '30000000-0000-0000-0000-0000000000%';

SELECT 'seed_enrollment_rows' AS check_name,
       COUNT(*) AS actual_count,
       25 AS expected_count
FROM course.enrollments
WHERE id::text LIKE '40000000-0000-0000-0000-0000000000%';

SELECT 'seed_lesson_rows' AS check_name,
       COUNT(*) AS actual_count,
       63 AS expected_count
FROM content.lessons
WHERE id::text LIKE '50000000-0000-0000-0000-0000000000%';

SELECT u.email AS instructor_email, c.category, c.status, COUNT(*) AS course_count
FROM course.courses c
JOIN auth.users u ON u.id = c.instructor_id
WHERE c.id::text LIKE '30000000-0000-0000-0000-0000000000%'
GROUP BY u.email, c.category, c.status
ORDER BY u.email, c.category, c.status;

WITH expected_enrollments(course_id, student_email) AS (
    VALUES
        ('30000000-0000-0000-0000-000000000001'::uuid, 'student@sagelms.dev'),
        ('30000000-0000-0000-0000-000000000002'::uuid, 'student@sagelms.dev'),
        ('30000000-0000-0000-0000-000000000001'::uuid, 'student2@sagelms.dev'),
        ('30000000-0000-0000-0000-000000000005'::uuid, 'student@sagelms.dev'),
        ('30000000-0000-0000-0000-000000000006'::uuid, 'student@sagelms.dev'),
        ('30000000-0000-0000-0000-000000000007'::uuid, 'student@sagelms.dev'),
        ('30000000-0000-0000-0000-000000000008'::uuid, 'student@sagelms.dev'),
        ('30000000-0000-0000-0000-000000000002'::uuid, 'student2@sagelms.dev'),
        ('30000000-0000-0000-0000-000000000005'::uuid, 'student2@sagelms.dev'),
        ('30000000-0000-0000-0000-000000000006'::uuid, 'student2@sagelms.dev'),
        ('30000000-0000-0000-0000-000000000009'::uuid, 'student2@sagelms.dev'),
        ('30000000-0000-0000-0000-000000000010'::uuid, 'student2@sagelms.dev')
)
SELECT 'seed_enrollments' AS check_name,
       COUNT(e.course_id) AS actual_count,
       COUNT(*) AS expected_count
FROM expected_enrollments expected
LEFT JOIN auth.users u ON u.email = expected.student_email
LEFT JOIN course.enrollments e ON e.course_id = expected.course_id AND e.student_id = u.id;

WITH expected_lessons(course_id, sort_order) AS (
    VALUES
        ('30000000-0000-0000-0000-000000000001'::uuid, 1),
        ('30000000-0000-0000-0000-000000000001'::uuid, 2),
        ('30000000-0000-0000-0000-000000000001'::uuid, 3),
        ('30000000-0000-0000-0000-000000000001'::uuid, 4),
        ('30000000-0000-0000-0000-000000000002'::uuid, 1),
        ('30000000-0000-0000-0000-000000000002'::uuid, 2),
        ('30000000-0000-0000-0000-000000000002'::uuid, 3),
        ('30000000-0000-0000-0000-000000000002'::uuid, 4),
        ('30000000-0000-0000-0000-000000000003'::uuid, 1),
        ('30000000-0000-0000-0000-000000000005'::uuid, 1),
        ('30000000-0000-0000-0000-000000000005'::uuid, 2),
        ('30000000-0000-0000-0000-000000000005'::uuid, 3),
        ('30000000-0000-0000-0000-000000000005'::uuid, 4),
        ('30000000-0000-0000-0000-000000000006'::uuid, 1),
        ('30000000-0000-0000-0000-000000000006'::uuid, 2),
        ('30000000-0000-0000-0000-000000000006'::uuid, 3),
        ('30000000-0000-0000-0000-000000000006'::uuid, 4),
        ('30000000-0000-0000-0000-000000000007'::uuid, 1),
        ('30000000-0000-0000-0000-000000000007'::uuid, 2),
        ('30000000-0000-0000-0000-000000000007'::uuid, 3),
        ('30000000-0000-0000-0000-000000000008'::uuid, 1),
        ('30000000-0000-0000-0000-000000000008'::uuid, 2),
        ('30000000-0000-0000-0000-000000000008'::uuid, 3),
        ('30000000-0000-0000-0000-000000000009'::uuid, 1),
        ('30000000-0000-0000-0000-000000000009'::uuid, 2),
        ('30000000-0000-0000-0000-000000000009'::uuid, 3),
        ('30000000-0000-0000-0000-000000000010'::uuid, 1),
        ('30000000-0000-0000-0000-000000000010'::uuid, 2),
        ('30000000-0000-0000-0000-000000000010'::uuid, 3),
        ('30000000-0000-0000-0000-000000000011'::uuid, 1),
        ('30000000-0000-0000-0000-000000000011'::uuid, 2),
        ('30000000-0000-0000-0000-000000000012'::uuid, 1),
        ('30000000-0000-0000-0000-000000000012'::uuid, 2)
)
SELECT 'seed_lessons' AS check_name,
       COUNT(l.course_id) AS actual_count,
       COUNT(*) AS expected_count
FROM expected_lessons expected
LEFT JOIN content.lessons l ON l.course_id = expected.course_id AND l.sort_order = expected.sort_order;

SELECT 'courses_missing_instructor' AS check_name, COUNT(*) AS row_count
FROM course.courses c
LEFT JOIN auth.users u ON u.id = c.instructor_id
WHERE c.id IN (
    '30000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000006',
    '30000000-0000-0000-0000-000000000007',
    '30000000-0000-0000-0000-000000000008',
    '30000000-0000-0000-0000-000000000009',
    '30000000-0000-0000-0000-000000000010',
    '30000000-0000-0000-0000-000000000011',
    '30000000-0000-0000-0000-000000000012'
)
AND u.id IS NULL;

SELECT 'enrollments_missing_relationship' AS check_name, COUNT(*) AS row_count
FROM course.enrollments e
LEFT JOIN auth.users u ON u.id = e.student_id
LEFT JOIN course.courses c ON c.id = e.course_id
WHERE e.course_id IN (
    '30000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000006',
    '30000000-0000-0000-0000-000000000007',
    '30000000-0000-0000-0000-000000000008',
    '30000000-0000-0000-0000-000000000009',
    '30000000-0000-0000-0000-000000000010'
)
AND (u.id IS NULL OR c.id IS NULL);

SELECT 'lessons_missing_relationship' AS check_name, COUNT(*) AS row_count
FROM content.lessons l
LEFT JOIN course.courses c ON c.id = l.course_id
LEFT JOIN auth.users u ON u.id = l.instructor_id
WHERE l.course_id IN (
    '30000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000006',
    '30000000-0000-0000-0000-000000000007',
    '30000000-0000-0000-0000-000000000008',
    '30000000-0000-0000-0000-000000000009',
    '30000000-0000-0000-0000-000000000010',
    '30000000-0000-0000-0000-000000000011',
    '30000000-0000-0000-0000-000000000012'
)
AND (c.id IS NULL OR u.id IS NULL);

SELECT e.status, u.email AS student_email, c.title AS course_title
FROM course.enrollments e
JOIN auth.users u ON u.id = e.student_id
JOIN course.courses c ON c.id = e.course_id
ORDER BY u.email, c.title;

SELECT c.title AS course_title, l.sort_order, l.title AS lesson_title, l.type, l.is_published
FROM content.lessons l
JOIN course.courses c ON c.id = l.course_id
ORDER BY c.title, l.sort_order;
