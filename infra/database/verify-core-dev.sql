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

SELECT 'seed_challenge_rows' AS check_name,
       COUNT(*) AS actual_count,
       6 AS expected_count
FROM challenge.challenges
WHERE id::text LIKE '70000000-0000-0000-0000-0000000000%';

SELECT 'seed_challenge_question_sets' AS check_name,
       COUNT(*) AS actual_count,
       9 AS expected_count
FROM challenge.challenge_question_sets
WHERE id::text LIKE '71000000-0000-0000-0000-0000000000%';

SELECT 'seed_challenge_questions' AS check_name,
       COUNT(*) AS actual_count,
       20 AS expected_count
FROM challenge.challenge_questions
WHERE id::text LIKE '72000000-0000-0000-0000-0000000000%';

SELECT 'seed_challenge_choices' AS check_name,
       COUNT(*) AS actual_count,
       33 AS expected_count
FROM challenge.challenge_choices
WHERE id::text LIKE '73000000-0000-0000-0000-0000000000%';

SELECT 'seed_challenge_attempts' AS check_name,
       COUNT(*) AS actual_count,
       8 AS expected_count
FROM challenge.challenge_attempts
WHERE id::text LIKE '74000000-0000-0000-0000-0000000000%';

SELECT 'seed_challenge_answers' AS check_name,
       COUNT(*) AS actual_count,
       19 AS expected_count
FROM challenge.challenge_answers
WHERE id::text LIKE '75000000-0000-0000-0000-0000000000%';

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

SELECT 'challenges_missing_instructor' AS check_name, COUNT(*) AS row_count
FROM challenge.challenges c
LEFT JOIN auth.users u ON u.id = c.instructor_id
WHERE c.id::text LIKE '70000000-0000-0000-0000-0000000000%'
AND u.id IS NULL;

SELECT 'challenge_sets_missing_relationship' AS check_name, COUNT(*) AS row_count
FROM challenge.challenge_question_sets qs
LEFT JOIN challenge.challenges c ON c.id = qs.challenge_id
WHERE qs.id::text LIKE '71000000-0000-0000-0000-0000000000%'
AND c.id IS NULL;

SELECT 'challenge_questions_missing_relationship' AS check_name, COUNT(*) AS row_count
FROM challenge.challenge_questions q
LEFT JOIN challenge.challenges c ON c.id = q.challenge_id
LEFT JOIN challenge.challenge_question_sets qs ON qs.id = q.question_set_id
WHERE q.id::text LIKE '72000000-0000-0000-0000-0000000000%'
AND (c.id IS NULL OR qs.id IS NULL);

SELECT 'challenge_choices_missing_question' AS check_name, COUNT(*) AS row_count
FROM challenge.challenge_choices ch
LEFT JOIN challenge.challenge_questions q ON q.id = ch.question_id
WHERE ch.id::text LIKE '73000000-0000-0000-0000-0000000000%'
AND q.id IS NULL;

SELECT 'challenge_attempts_missing_relationship' AS check_name, COUNT(*) AS row_count
FROM challenge.challenge_attempts a
LEFT JOIN challenge.challenges c ON c.id = a.challenge_id
LEFT JOIN challenge.challenge_question_sets qs ON qs.id = a.question_set_id
LEFT JOIN auth.users u ON u.id = a.participant_id
WHERE a.id::text LIKE '74000000-0000-0000-0000-0000000000%'
AND (c.id IS NULL OR qs.id IS NULL OR u.id IS NULL);

SELECT 'challenge_answers_missing_relationship' AS check_name, COUNT(*) AS row_count
FROM challenge.challenge_answers a
LEFT JOIN challenge.challenge_attempts ca ON ca.id = a.attempt_id
LEFT JOIN challenge.challenge_questions q ON q.id = a.question_id
LEFT JOIN challenge.challenge_choices ch ON ch.id = a.choice_id
WHERE a.id::text LIKE '75000000-0000-0000-0000-0000000000%'
AND (ca.id IS NULL OR q.id IS NULL OR (a.choice_id IS NOT NULL AND ch.id IS NULL));

SELECT e.status, u.email AS student_email, c.title AS course_title
FROM course.enrollments e
JOIN auth.users u ON u.id = e.student_id
JOIN course.courses c ON c.id = e.course_id
ORDER BY u.email, c.title;

SELECT c.title AS course_title, l.sort_order, l.title AS lesson_title, l.type, l.is_published
FROM content.lessons l
JOIN course.courses c ON c.id = l.course_id
ORDER BY c.title, l.sort_order;

SELECT ch.status,
       ch.category,
       u.email AS instructor_email,
       COUNT(DISTINCT qs.id) AS question_sets,
       COUNT(DISTINCT q.id) AS questions,
       COUNT(DISTINCT a.id) AS attempts
FROM challenge.challenges ch
JOIN auth.users u ON u.id = ch.instructor_id
LEFT JOIN challenge.challenge_question_sets qs ON qs.challenge_id = ch.id
LEFT JOIN challenge.challenge_questions q ON q.challenge_id = ch.id
LEFT JOIN challenge.challenge_attempts a ON a.challenge_id = ch.id
WHERE ch.id::text LIKE '70000000-0000-0000-0000-0000000000%'
GROUP BY ch.status, ch.category, u.email
ORDER BY ch.status, ch.category, u.email;

SELECT ch.title AS challenge_title,
       qs.title AS question_set_title,
       q.sort_order,
       q.title AS question_title,
       q.type,
       q.points
FROM challenge.challenge_questions q
JOIN challenge.challenge_question_sets qs ON qs.id = q.question_set_id
JOIN challenge.challenges ch ON ch.id = q.challenge_id
WHERE q.id::text LIKE '72000000-0000-0000-0000-0000000000%'
ORDER BY ch.title, qs.sort_order, q.sort_order;

SELECT ch.title AS challenge_title,
       a.participant_email,
       a.grading_status,
       a.score,
       a.max_score,
       a.passed
FROM challenge.challenge_attempts a
JOIN challenge.challenges ch ON ch.id = a.challenge_id
WHERE a.id::text LIKE '74000000-0000-0000-0000-0000000000%'
ORDER BY ch.title, a.participant_email;
