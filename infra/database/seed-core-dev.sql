-- SageLMS core development seed data.
--
-- Scope:
--   - auth-service    -> auth.users
--   - course-service  -> course.courses, course.enrollments
--   - content-service -> content.lessons
--
-- Run this after the services have applied Flyway migrations.
-- Default login credentials are listed near the bottom of this file.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS course;
CREATE SCHEMA IF NOT EXISTS content;

DO $$
BEGIN
    IF to_regclass('auth.users') IS NULL THEN
        RAISE EXCEPTION 'Missing table auth.users. Start auth-service once so Flyway can run migrations first.';
    END IF;
    IF to_regclass('course.courses') IS NULL THEN
        RAISE EXCEPTION 'Missing table course.courses. Start course-service once so Flyway can run migrations first.';
    END IF;
    IF to_regclass('content.lessons') IS NULL THEN
        RAISE EXCEPTION 'Missing table content.lessons. Start content-service once so Flyway can run migrations first.';
    END IF;
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'auth'
          AND table_name = 'users'
          AND column_name = 'instructor_approval_status'
    ) THEN
        RAISE EXCEPTION 'Missing auth.users.instructor_approval_status. Run auth-service migration V2 first.';
    END IF;
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'content'
          AND table_name = 'lessons'
          AND column_name = 'instructor_id'
    ) THEN
        RAISE EXCEPTION 'Missing content.lessons.instructor_id. Run content-service migration V2 first.';
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------

INSERT INTO auth.users (
    id,
    email,
    password_hash,
    full_name,
    role,
    avatar_url,
    is_active,
    instructor_approval_status,
    instructor_headline,
    instructor_bio,
    instructor_expertise,
    instructor_website,
    instructor_years_experience,
    instructor_application_note,
    instructor_reviewed_at,
    created_at,
    updated_at
)
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'admin@sagelms.dev',
        crypt('Admin123!', gen_salt('bf', 10)),
        'Admin User',
        'ADMIN',
        NULL,
        TRUE,
        'APPROVED',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NOW() - INTERVAL '30 days',
        NOW() - INTERVAL '30 days',
        NOW()
    ),
    (
        '10000000-0000-0000-0000-000000000001',
        'instructor@sagelms.dev',
        crypt('Instructor123!', gen_salt('bf', 10)),
        'Demo Instructor',
        'INSTRUCTOR',
        NULL,
        TRUE,
        'APPROVED',
        'Senior Backend Instructor',
        'Builds practical backend systems with Spring Boot, PostgreSQL, Docker, and production-grade API design.',
        'Java, Spring Boot, PostgreSQL, Microservices',
        'https://example.com/demo-instructor',
        8,
        'Approved demo instructor for course and content testing.',
        NOW() - INTERVAL '20 days',
        NOW() - INTERVAL '28 days',
        NOW()
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        'pending.instructor@sagelms.dev',
        crypt('Instructor123!', gen_salt('bf', 10)),
        'Pending Instructor',
        'INSTRUCTOR',
        NULL,
        FALSE,
        'PENDING',
        'Data Science Mentor',
        'Teaches beginner-friendly analytics and machine learning workflows.',
        'Python, Data Science, ML',
        'https://example.com/pending-instructor',
        5,
        'Please review portfolio and course outline.',
        NULL,
        NOW() - INTERVAL '2 days',
        NOW()
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        'rejected.instructor@sagelms.dev',
        crypt('Instructor123!', gen_salt('bf', 10)),
        'Rejected Instructor',
        'INSTRUCTOR',
        NULL,
        FALSE,
        'REJECTED',
        'Frontend Coach',
        'Application kept for rejected-state UI testing.',
        'React, UI Engineering',
        NULL,
        2,
        'Rejected demo profile.',
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '5 days',
        NOW()
    ),
    (
        '20000000-0000-0000-0000-000000000001',
        'student@sagelms.dev',
        crypt('Student123!', gen_salt('bf', 10)),
        'Demo Student',
        'STUDENT',
        NULL,
        TRUE,
        'APPROVED',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NOW() - INTERVAL '25 days',
        NOW() - INTERVAL '25 days',
        NOW()
    ),
    (
        '20000000-0000-0000-0000-000000000002',
        'student2@sagelms.dev',
        crypt('Student123!', gen_salt('bf', 10)),
        'Second Student',
        'STUDENT',
        NULL,
        TRUE,
        'APPROVED',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NOW() - INTERVAL '18 days',
        NOW() - INTERVAL '18 days',
        NOW()
    )
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    avatar_url = EXCLUDED.avatar_url,
    is_active = EXCLUDED.is_active,
    instructor_approval_status = EXCLUDED.instructor_approval_status,
    instructor_headline = EXCLUDED.instructor_headline,
    instructor_bio = EXCLUDED.instructor_bio,
    instructor_expertise = EXCLUDED.instructor_expertise,
    instructor_website = EXCLUDED.instructor_website,
    instructor_years_experience = EXCLUDED.instructor_years_experience,
    instructor_application_note = EXCLUDED.instructor_application_note,
    instructor_reviewed_at = EXCLUDED.instructor_reviewed_at,
    updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Courses
-- ---------------------------------------------------------------------------

INSERT INTO course.courses (
    id,
    title,
    description,
    thumbnail_url,
    instructor_id,
    status,
    category,
    created_at,
    updated_at
)
VALUES
    (
        '30000000-0000-0000-0000-000000000001',
        'Spring Boot Backend Foundations',
        'A practical course for building REST APIs, persistence layers, service boundaries, and production-ready backend workflows.',
        'https://images.unsplash.com/photo-1515879218367-8466d910aaa4',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'PUBLISHED',
        'Programming',
        NOW() - INTERVAL '21 days',
        NOW()
    ),
    (
        '30000000-0000-0000-0000-000000000002',
        'React LMS Frontend Essentials',
        'Build dashboard screens, course browsing, lesson viewing, forms, and role-aware UI for a learning platform.',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'PUBLISHED',
        'Web Development',
        NOW() - INTERVAL '16 days',
        NOW()
    ),
    (
        '30000000-0000-0000-0000-000000000003',
        'Microservices Security Playbook',
        'Draft course used to test instructor/admin visibility, gateway headers, and internal service access.',
        NULL,
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'DRAFT',
        'DevOps',
        NOW() - INTERVAL '8 days',
        NOW()
    ),
    (
        '30000000-0000-0000-0000-000000000004',
        'Archived Legacy Course',
        'Archived course used to test hidden catalog states.',
        NULL,
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'ARCHIVED',
        'Business',
        NOW() - INTERVAL '60 days',
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    thumbnail_url = EXCLUDED.thumbnail_url,
    instructor_id = EXCLUDED.instructor_id,
    status = EXCLUDED.status,
    category = EXCLUDED.category,
    updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Enrollments
-- ---------------------------------------------------------------------------

INSERT INTO course.enrollments (
    id,
    course_id,
    student_id,
    enrolled_at,
    status
)
VALUES
    (
        '40000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        (SELECT id FROM auth.users WHERE email = 'student@sagelms.dev'),
        NOW() - INTERVAL '12 days',
        'ACTIVE'
    ),
    (
        '40000000-0000-0000-0000-000000000002',
        '30000000-0000-0000-0000-000000000002',
        (SELECT id FROM auth.users WHERE email = 'student@sagelms.dev'),
        NOW() - INTERVAL '6 days',
        'ACTIVE'
    ),
    (
        '40000000-0000-0000-0000-000000000003',
        '30000000-0000-0000-0000-000000000001',
        (SELECT id FROM auth.users WHERE email = 'student2@sagelms.dev'),
        NOW() - INTERVAL '4 days',
        'DROPPED'
    )
ON CONFLICT (course_id, student_id) DO UPDATE SET
    enrolled_at = EXCLUDED.enrolled_at,
    status = EXCLUDED.status;

-- ---------------------------------------------------------------------------
-- Lessons
-- ---------------------------------------------------------------------------

INSERT INTO content.lessons (
    id,
    course_id,
    instructor_id,
    title,
    type,
    content_url,
    text_content,
    sort_order,
    duration_minutes,
    is_published,
    created_at,
    updated_at
)
VALUES
    (
        '50000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Course overview and local setup',
        'TEXT',
        NULL,
        'Install Java 17, Docker, PostgreSQL, and run the SageLMS services through the gateway before starting the backend labs.',
        1,
        12,
        TRUE,
        NOW() - INTERVAL '20 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000002',
        '30000000-0000-0000-0000-000000000001',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Designing REST endpoints',
        'VIDEO',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        NULL,
        2,
        25,
        TRUE,
        NOW() - INTERVAL '19 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000003',
        '30000000-0000-0000-0000-000000000001',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Repository and service layer checklist',
        'PDF',
        'https://example.com/sagelms/backend-checklist.pdf',
        NULL,
        3,
        10,
        TRUE,
        NOW() - INTERVAL '18 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000004',
        '30000000-0000-0000-0000-000000000002',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Frontend architecture overview',
        'TEXT',
        NULL,
        'This lesson explains pages, routes, hooks, typed API clients, and the dashboard layout used by the React application.',
        1,
        15,
        TRUE,
        NOW() - INTERVAL '15 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000005',
        '30000000-0000-0000-0000-000000000002',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'React Router documentation',
        'LINK',
        'https://reactrouter.com/',
        NULL,
        2,
        8,
        TRUE,
        NOW() - INTERVAL '14 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000006',
        '30000000-0000-0000-0000-000000000003',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Internal service header strategy',
        'TEXT',
        NULL,
        'Draft-only lesson for testing instructor/admin management views.',
        1,
        18,
        FALSE,
        NOW() - INTERVAL '7 days',
        NOW()
    )
ON CONFLICT (course_id, sort_order) DO UPDATE SET
    course_id = EXCLUDED.course_id,
    instructor_id = EXCLUDED.instructor_id,
    title = EXCLUDED.title,
    type = EXCLUDED.type,
    content_url = EXCLUDED.content_url,
    text_content = EXCLUDED.text_content,
    sort_order = EXCLUDED.sort_order,
    duration_minutes = EXCLUDED.duration_minutes,
    is_published = EXCLUDED.is_published,
    updated_at = NOW();

COMMIT;

-- ---------------------------------------------------------------------------
-- Test accounts
-- ---------------------------------------------------------------------------
-- admin@sagelms.dev              / Admin123!
-- instructor@sagelms.dev         / Instructor123!
-- pending.instructor@sagelms.dev / Instructor123!  -- cannot login until approved
-- rejected.instructor@sagelms.dev / Instructor123! -- rejected account
-- student@sagelms.dev            / Student123!
-- student2@sagelms.dev           / Student123!
