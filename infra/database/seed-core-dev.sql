-- SageLMS core development seed data.
--
-- Scope:
--   - auth-service    -> auth.users
--                    -> auth.notifications, auth.notification_preferences
--   - course-service  -> course.courses, course.enrollments
--   - content-service -> content.lessons
--   - challenge-service -> challenge.challenges, question sets, questions, choices, attempts, answers
--
-- Run this after the services have applied Flyway migrations.
-- Default login credentials are listed near the bottom of this file.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS course;
CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS challenge;

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
    IF to_regclass('challenge.challenges') IS NULL THEN
        RAISE EXCEPTION 'Missing table challenge.challenges. Start challenge-service once so Flyway can run migrations first.';
    END IF;
    IF to_regclass('challenge.challenge_question_sets') IS NULL THEN
        RAISE EXCEPTION 'Missing table challenge.challenge_question_sets. Run challenge-service migration V2 first.';
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

-- Keep the dev seed runnable even when the local DB has not been rebuilt after
-- adding the course enrollment approval migration.
ALTER TABLE course.courses
    ADD COLUMN IF NOT EXISTS enrollment_policy VARCHAR(30) NOT NULL DEFAULT 'OPEN';

ALTER TABLE course.courses
    DROP CONSTRAINT IF EXISTS courses_enrollment_policy_check;

ALTER TABLE course.courses
    ADD CONSTRAINT courses_enrollment_policy_check
        CHECK (enrollment_policy IN ('OPEN', 'APPROVAL_REQUIRED'));

ALTER TABLE course.enrollments
    DROP CONSTRAINT IF EXISTS enrollments_status_check;

ALTER TABLE course.enrollments
    ADD CONSTRAINT enrollments_status_check
        CHECK (status IN ('PENDING', 'ACTIVE', 'DROPPED', 'COMPLETED', 'REJECTED'));

ALTER TABLE course.enrollments
    ADD COLUMN IF NOT EXISTS review_note VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reviewed_by UUID;

CREATE INDEX IF NOT EXISTS idx_courses_enrollment_policy
    ON course.courses (enrollment_policy);

CREATE INDEX IF NOT EXISTS idx_enrollments_course_status
    ON course.enrollments (course_id, status);

CREATE TABLE IF NOT EXISTS auth.notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    type        VARCHAR(40) NOT NULL CHECK (type IN (
        'ENROLLMENT_REQUESTED',
        'ENROLLMENT_APPROVED',
        'ENROLLMENT_REJECTED',
        'COURSE_ENROLLED',
        'SYSTEM'
    )),
    title       VARCHAR(255) NOT NULL,
    message     VARCHAR(1000),
    target_url  VARCHAR(500),
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON auth.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON auth.notifications (user_id)
    WHERE is_read = FALSE;

CREATE TABLE IF NOT EXISTS auth.notification_preferences (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL UNIQUE,
    in_app_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
    enrollment_requests  BOOLEAN NOT NULL DEFAULT TRUE,
    enrollment_results   BOOLEAN NOT NULL DEFAULT TRUE,
    course_updates       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);

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
    ),
    (
        '30000000-0000-0000-0000-000000000005',
        'PostgreSQL for Application Developers',
        'Learn relational modeling, indexes, transactions, query tuning, and practical SQL patterns for backend applications.',
        'https://images.unsplash.com/photo-1544383835-bda2bc66a55d',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'PUBLISHED',
        'Database',
        NOW() - INTERVAL '14 days',
        NOW()
    ),
    (
        '30000000-0000-0000-0000-000000000006',
        'Docker Compose for LMS Microservices',
        'Run and debug a local microservice stack with Docker Compose, PostgreSQL, Redis, gateway routing, and service logs.',
        'https://images.unsplash.com/photo-1605745341112-85968b19335b',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'PUBLISHED',
        'DevOps',
        NOW() - INTERVAL '13 days',
        NOW()
    ),
    (
        '30000000-0000-0000-0000-000000000007',
        'UI Systems with Tailwind and React',
        'Design reusable UI primitives, dashboard layouts, stateful forms, and accessible interaction patterns.',
        'https://images.unsplash.com/photo-1558655146-d09347e92766',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'PUBLISHED',
        'Design',
        NOW() - INTERVAL '11 days',
        NOW()
    ),
    (
        '30000000-0000-0000-0000-000000000008',
        'Business Analytics Fundamentals',
        'Use data to define business questions, measure product funnels, and communicate insights clearly.',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'PUBLISHED',
        'Business',
        NOW() - INTERVAL '10 days',
        NOW()
    ),
    (
        '30000000-0000-0000-0000-000000000009',
        'Mobile App Product Thinking',
        'Plan mobile learning experiences from user journey, feature scope, release plan, and feedback loops.',
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'PUBLISHED',
        'Mobile Development',
        NOW() - INTERVAL '9 days',
        NOW()
    ),
    (
        '30000000-0000-0000-0000-000000000010',
        'Marketing Landing Page Workshop',
        'Create landing pages with clear offers, proof, conversion goals, and campaign-ready messaging.',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'PUBLISHED',
        'Marketing',
        NOW() - INTERVAL '7 days',
        NOW()
    ),
    (
        '30000000-0000-0000-0000-000000000011',
        'Advanced Assessment Design',
        'Draft course for building better quizzes, scoring rubrics, remediation flows, and assessment analytics.',
        NULL,
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'DRAFT',
        'Education',
        NOW() - INTERVAL '5 days',
        NOW()
    ),
    (
        '30000000-0000-0000-0000-000000000012',
        'Legacy jQuery Migration',
        'Archived sample for testing hidden courses and migrated legacy content.',
        NULL,
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'ARCHIVED',
        'Web Development',
        NOW() - INTERVAL '90 days',
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
    ),
    (
        '40000000-0000-0000-0000-000000000004',
        '30000000-0000-0000-0000-000000000005',
        (SELECT id FROM auth.users WHERE email = 'student@sagelms.dev'),
        NOW() - INTERVAL '5 days',
        'ACTIVE'
    ),
    (
        '40000000-0000-0000-0000-000000000005',
        '30000000-0000-0000-0000-000000000006',
        (SELECT id FROM auth.users WHERE email = 'student@sagelms.dev'),
        NOW() - INTERVAL '4 days',
        'ACTIVE'
    ),
    (
        '40000000-0000-0000-0000-000000000006',
        '30000000-0000-0000-0000-000000000007',
        (SELECT id FROM auth.users WHERE email = 'student@sagelms.dev'),
        NOW() - INTERVAL '3 days',
        'ACTIVE'
    ),
    (
        '40000000-0000-0000-0000-000000000007',
        '30000000-0000-0000-0000-000000000008',
        (SELECT id FROM auth.users WHERE email = 'student@sagelms.dev'),
        NOW() - INTERVAL '2 days',
        'COMPLETED'
    ),
    (
        '40000000-0000-0000-0000-000000000008',
        '30000000-0000-0000-0000-000000000002',
        (SELECT id FROM auth.users WHERE email = 'student2@sagelms.dev'),
        NOW() - INTERVAL '6 days',
        'ACTIVE'
    ),
    (
        '40000000-0000-0000-0000-000000000009',
        '30000000-0000-0000-0000-000000000005',
        (SELECT id FROM auth.users WHERE email = 'student2@sagelms.dev'),
        NOW() - INTERVAL '5 days',
        'ACTIVE'
    ),
    (
        '40000000-0000-0000-0000-000000000010',
        '30000000-0000-0000-0000-000000000006',
        (SELECT id FROM auth.users WHERE email = 'student2@sagelms.dev'),
        NOW() - INTERVAL '3 days',
        'ACTIVE'
    ),
    (
        '40000000-0000-0000-0000-000000000011',
        '30000000-0000-0000-0000-000000000009',
        (SELECT id FROM auth.users WHERE email = 'student2@sagelms.dev'),
        NOW() - INTERVAL '2 days',
        'ACTIVE'
    ),
    (
        '40000000-0000-0000-0000-000000000012',
        '30000000-0000-0000-0000-000000000010',
        (SELECT id FROM auth.users WHERE email = 'student2@sagelms.dev'),
        NOW() - INTERVAL '1 day',
        'ACTIVE'
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
    ),
    (
        '50000000-0000-0000-0000-000000000007',
        '30000000-0000-0000-0000-000000000001',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Handling validation and error responses',
        'TEXT',
        NULL,
        'Standardize validation, not-found, forbidden, and conflict responses so frontend screens can show predictable errors.',
        4,
        18,
        TRUE,
        NOW() - INTERVAL '17 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000008',
        '30000000-0000-0000-0000-000000000002',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Building role-aware pages',
        'TEXT',
        NULL,
        'Use auth context and route guards to show the right actions for students, instructors, and admins.',
        3,
        16,
        TRUE,
        NOW() - INTERVAL '13 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000009',
        '30000000-0000-0000-0000-000000000002',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Frontend QA checklist',
        'PDF',
        'https://example.com/sagelms/frontend-qa-checklist.pdf',
        NULL,
        4,
        9,
        TRUE,
        NOW() - INTERVAL '12 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000010',
        '30000000-0000-0000-0000-000000000005',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Relational schema design',
        'TEXT',
        NULL,
        'Model entities, constraints, unique keys, and soft references for microservice-owned schemas.',
        1,
        20,
        TRUE,
        NOW() - INTERVAL '13 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000011',
        '30000000-0000-0000-0000-000000000005',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Indexes and query plans',
        'VIDEO',
        'https://example.com/videos/postgres-indexes',
        NULL,
        2,
        28,
        TRUE,
        NOW() - INTERVAL '12 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000012',
        '30000000-0000-0000-0000-000000000005',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Transaction isolation notes',
        'PDF',
        'https://example.com/sagelms/transaction-isolation.pdf',
        NULL,
        3,
        12,
        TRUE,
        NOW() - INTERVAL '11 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000013',
        '30000000-0000-0000-0000-000000000005',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'PostgreSQL documentation map',
        'LINK',
        'https://www.postgresql.org/docs/',
        NULL,
        4,
        7,
        TRUE,
        NOW() - INTERVAL '10 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000014',
        '30000000-0000-0000-0000-000000000006',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Compose file anatomy',
        'TEXT',
        NULL,
        'Break down services, ports, volumes, health checks, environment variables, and profiles in Docker Compose.',
        1,
        18,
        TRUE,
        NOW() - INTERVAL '12 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000015',
        '30000000-0000-0000-0000-000000000006',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Reading service logs',
        'VIDEO',
        'https://example.com/videos/docker-service-logs',
        NULL,
        2,
        22,
        TRUE,
        NOW() - INTERVAL '11 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000016',
        '30000000-0000-0000-0000-000000000006',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Gateway and internal secrets',
        'TEXT',
        NULL,
        'Separate public gateway traffic from internal service calls using trusted headers and shared internal secrets.',
        3,
        17,
        TRUE,
        NOW() - INTERVAL '10 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000017',
        '30000000-0000-0000-0000-000000000006',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Docker Compose reference',
        'LINK',
        'https://docs.docker.com/compose/',
        NULL,
        4,
        6,
        TRUE,
        NOW() - INTERVAL '9 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000018',
        '30000000-0000-0000-0000-000000000007',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Design tokens and component variants',
        'TEXT',
        NULL,
        'Define spacing, color, typography, and component variants without coupling every screen to one-off styles.',
        1,
        19,
        TRUE,
        NOW() - INTERVAL '10 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000019',
        '30000000-0000-0000-0000-000000000007',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Accessible form controls',
        'VIDEO',
        'https://example.com/videos/accessible-react-forms',
        NULL,
        2,
        24,
        TRUE,
        NOW() - INTERVAL '9 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000020',
        '30000000-0000-0000-0000-000000000007',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Tailwind documentation',
        'LINK',
        'https://tailwindcss.com/docs',
        NULL,
        3,
        5,
        TRUE,
        NOW() - INTERVAL '8 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000021',
        '30000000-0000-0000-0000-000000000008',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Choosing useful metrics',
        'TEXT',
        NULL,
        'Translate business goals into input, output, and guardrail metrics for product decisions.',
        1,
        14,
        TRUE,
        NOW() - INTERVAL '9 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000022',
        '30000000-0000-0000-0000-000000000008',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Funnel analysis worksheet',
        'PDF',
        'https://example.com/sagelms/funnel-analysis.pdf',
        NULL,
        2,
        11,
        TRUE,
        NOW() - INTERVAL '8 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000023',
        '30000000-0000-0000-0000-000000000008',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Presenting insights',
        'TEXT',
        NULL,
        'Turn data observations into decisions, risks, and next steps that stakeholders can act on.',
        3,
        13,
        TRUE,
        NOW() - INTERVAL '7 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000024',
        '30000000-0000-0000-0000-000000000009',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Mobile learning journeys',
        'TEXT',
        NULL,
        'Map onboarding, lesson discovery, offline constraints, reminders, and course completion loops for mobile learners.',
        1,
        17,
        TRUE,
        NOW() - INTERVAL '8 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000025',
        '30000000-0000-0000-0000-000000000009',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Release planning for MVPs',
        'VIDEO',
        'https://example.com/videos/mobile-mvp-release',
        NULL,
        2,
        21,
        TRUE,
        NOW() - INTERVAL '7 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000026',
        '30000000-0000-0000-0000-000000000009',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Mobile UX research guide',
        'LINK',
        'https://www.nngroup.com/articles/mobile-ux/',
        NULL,
        3,
        8,
        TRUE,
        NOW() - INTERVAL '6 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000027',
        '30000000-0000-0000-0000-000000000010',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Landing page offer structure',
        'TEXT',
        NULL,
        'Write a clear promise, audience fit, proof, and call to action for a focused campaign page.',
        1,
        12,
        TRUE,
        NOW() - INTERVAL '6 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000028',
        '30000000-0000-0000-0000-000000000010',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'A/B test plan template',
        'PDF',
        'https://example.com/sagelms/ab-test-plan.pdf',
        NULL,
        2,
        10,
        TRUE,
        NOW() - INTERVAL '5 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000029',
        '30000000-0000-0000-0000-000000000010',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Campaign analytics basics',
        'TEXT',
        NULL,
        'Connect traffic sources, conversion events, and campaign reporting into one measurable workflow.',
        3,
        14,
        TRUE,
        NOW() - INTERVAL '4 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000030',
        '30000000-0000-0000-0000-000000000011',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Question quality rubric',
        'TEXT',
        NULL,
        'Draft rubric for measuring clarity, difficulty, distractor quality, and learning objective coverage.',
        1,
        16,
        FALSE,
        NOW() - INTERVAL '4 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000031',
        '30000000-0000-0000-0000-000000000011',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Remediation flow outline',
        'PDF',
        'https://example.com/sagelms/remediation-flow.pdf',
        NULL,
        2,
        8,
        FALSE,
        NOW() - INTERVAL '3 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000032',
        '30000000-0000-0000-0000-000000000012',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Legacy plugin inventory',
        'TEXT',
        NULL,
        'Archived sample lesson for catalog and management regression testing.',
        1,
        9,
        TRUE,
        NOW() - INTERVAL '80 days',
        NOW()
    ),
    (
        '50000000-0000-0000-0000-000000000033',
        '30000000-0000-0000-0000-000000000012',
        (SELECT id FROM auth.users WHERE email = 'instructor@sagelms.dev'),
        'Migration risk checklist',
        'PDF',
        'https://example.com/sagelms/migration-risk-checklist.pdf',
        NULL,
        2,
        7,
        TRUE,
        NOW() - INTERVAL '79 days',
        NOW()
    )
ON CONFLICT (course_id, sort_order) WHERE is_deleted = FALSE DO UPDATE SET
    course_id = EXCLUDED.course_id,
    instructor_id = EXCLUDED.instructor_id,
    title = EXCLUDED.title,
    type = EXCLUDED.type,
    content_url = EXCLUDED.content_url,
    text_content = EXCLUDED.text_content,
    sort_order = EXCLUDED.sort_order,
    duration_minutes = EXCLUDED.duration_minutes,
    is_published = EXCLUDED.is_published,
    is_deleted = FALSE,
    updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Extended QA users, courses, enrollments, and lessons
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
        '10000000-0000-0000-0000-000000000004',
        'frontend.instructor@sagelms.dev',
        crypt('Instructor123!', gen_salt('bf', 10)),
        'Linh Nguyen',
        'INSTRUCTOR',
        NULL,
        TRUE,
        'APPROVED',
        'Frontend Architecture Mentor',
        'Specializes in React architecture, design systems, accessibility, and performance for complex dashboard products.',
        'React, TypeScript, Design Systems, Accessibility',
        'https://example.com/linh-frontend',
        7,
        'Approved QA instructor for frontend-owned course tests.',
        NOW() - INTERVAL '18 days',
        NOW() - INTERVAL '22 days',
        NOW()
    ),
    (
        '10000000-0000-0000-0000-000000000005',
        'data.instructor@sagelms.dev',
        crypt('Instructor123!', gen_salt('bf', 10)),
        'Minh Tran',
        'INSTRUCTOR',
        NULL,
        TRUE,
        'APPROVED',
        'Data and AI Instructor',
        'Builds practical analytics, SQL reporting, machine learning, and AI assistant workflows for product teams.',
        'Python, SQL, Data Science, AI',
        'https://example.com/minh-data',
        9,
        'Approved QA instructor for data and AI course ownership tests.',
        NOW() - INTERVAL '17 days',
        NOW() - INTERVAL '21 days',
        NOW()
    ),
    (
        '10000000-0000-0000-0000-000000000006',
        'devops.instructor@sagelms.dev',
        crypt('Instructor123!', gen_salt('bf', 10)),
        'Khoa Pham',
        'INSTRUCTOR',
        NULL,
        TRUE,
        'APPROVED',
        'DevOps and Cloud Security Coach',
        'Teaches deployment, CI/CD, observability, cloud security, and production incident workflows.',
        'Docker, Kubernetes, CI/CD, Observability, Security',
        'https://example.com/khoa-devops',
        10,
        'Approved QA instructor for DevOps course ownership tests.',
        NOW() - INTERVAL '16 days',
        NOW() - INTERVAL '20 days',
        NOW()
    ),
    (
        '10000000-0000-0000-0000-000000000007',
        'product.instructor@sagelms.dev',
        crypt('Instructor123!', gen_salt('bf', 10)),
        'An Le',
        'INSTRUCTOR',
        NULL,
        TRUE,
        'APPROVED',
        'Product and Growth Instructor',
        'Works on product discovery, learning experience strategy, growth analytics, and SaaS operations.',
        'Product Management, Growth, Education, Business',
        'https://example.com/an-product',
        6,
        'Approved QA instructor for product and business course tests.',
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '19 days',
        NOW()
    ),
    (
        '20000000-0000-0000-0000-000000000003',
        'student3@sagelms.dev',
        crypt('Student123!', gen_salt('bf', 10)),
        'Third Student',
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
        NOW() - INTERVAL '14 days',
        NOW() - INTERVAL '14 days',
        NOW()
    ),
    (
        '20000000-0000-0000-0000-000000000004',
        'student4@sagelms.dev',
        crypt('Student123!', gen_salt('bf', 10)),
        'Fourth Student',
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
        NOW() - INTERVAL '11 days',
        NOW() - INTERVAL '11 days',
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
    ('30000000-0000-0000-0000-000000000013', 'Frontend Performance Masterclass', 'Optimize React bundles, rendering behavior, Core Web Vitals, and production debugging workflows.', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6', (SELECT id FROM auth.users WHERE email = 'frontend.instructor@sagelms.dev'), 'PUBLISHED', 'Web Development', NOW() - INTERVAL '18 days', NOW()),
    ('30000000-0000-0000-0000-000000000014', 'React Admin Dashboards', 'Build dense admin interfaces with tables, filters, forms, role-aware actions, and resilient loading states.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71', (SELECT id FROM auth.users WHERE email = 'frontend.instructor@sagelms.dev'), 'PUBLISHED', 'Web Development', NOW() - INTERVAL '17 days', NOW()),
    ('30000000-0000-0000-0000-000000000015', 'Design Systems in Practice', 'Create reusable component APIs, tokens, variants, documentation, and review workflows for product teams.', 'https://images.unsplash.com/photo-1558655146-d09347e92766', (SELECT id FROM auth.users WHERE email = 'frontend.instructor@sagelms.dev'), 'PUBLISHED', 'Design', NOW() - INTERVAL '16 days', NOW()),
    ('30000000-0000-0000-0000-000000000016', 'UX Writing for Learning Products', 'Write labels, empty states, validation copy, and onboarding messages for learning platforms.', NULL, (SELECT id FROM auth.users WHERE email = 'frontend.instructor@sagelms.dev'), 'DRAFT', 'Design', NOW() - INTERVAL '8 days', NOW()),
    ('30000000-0000-0000-0000-000000000017', 'Python Data Analytics Lab', 'Analyze product datasets with Python, notebooks, charts, and repeatable reporting workflows.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71', (SELECT id FROM auth.users WHERE email = 'data.instructor@sagelms.dev'), 'PUBLISHED', 'Data Science', NOW() - INTERVAL '18 days', NOW()),
    ('30000000-0000-0000-0000-000000000018', 'Machine Learning Basics for Product Teams', 'Understand model framing, features, evaluation, risks, and how to work with ML teams.', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c', (SELECT id FROM auth.users WHERE email = 'data.instructor@sagelms.dev'), 'PUBLISHED', 'Data Science', NOW() - INTERVAL '15 days', NOW()),
    ('30000000-0000-0000-0000-000000000019', 'SQL Reporting for Operations', 'Build practical reports, joins, aggregates, cohort queries, and operational dashboards.', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d', (SELECT id FROM auth.users WHERE email = 'data.instructor@sagelms.dev'), 'PUBLISHED', 'Database', NOW() - INTERVAL '13 days', NOW()),
    ('30000000-0000-0000-0000-000000000020', 'AI Tutor Prompting Fundamentals', 'Design prompts, guardrails, feedback loops, and evaluation tasks for learning assistants.', NULL, (SELECT id FROM auth.users WHERE email = 'data.instructor@sagelms.dev'), 'DRAFT', 'AI', NOW() - INTERVAL '6 days', NOW()),
    ('30000000-0000-0000-0000-000000000021', 'Kubernetes Deployment Basics', 'Deploy services with manifests, health checks, config, secrets, and rollout strategies.', 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9', (SELECT id FROM auth.users WHERE email = 'devops.instructor@sagelms.dev'), 'PUBLISHED', 'DevOps', NOW() - INTERVAL '19 days', NOW()),
    ('30000000-0000-0000-0000-000000000022', 'CI/CD Quality Gates', 'Create pipelines with tests, lint, build checks, image builds, and branch protection rules.', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4', (SELECT id FROM auth.users WHERE email = 'devops.instructor@sagelms.dev'), 'PUBLISHED', 'DevOps', NOW() - INTERVAL '14 days', NOW()),
    ('30000000-0000-0000-0000-000000000023', 'Observability for Microservices', 'Use logs, metrics, traces, dashboards, and incident notes to debug distributed systems.', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31', (SELECT id FROM auth.users WHERE email = 'devops.instructor@sagelms.dev'), 'PUBLISHED', 'DevOps', NOW() - INTERVAL '12 days', NOW()),
    ('30000000-0000-0000-0000-000000000024', 'Cloud Security Essentials', 'Apply least privilege, secret hygiene, network boundaries, and deployment security checks.', NULL, (SELECT id FROM auth.users WHERE email = 'devops.instructor@sagelms.dev'), 'PUBLISHED', 'Cybersecurity', NOW() - INTERVAL '10 days', NOW()),
    ('30000000-0000-0000-0000-000000000025', 'Product Discovery for Course Platforms', 'Interview users, map assumptions, prioritize opportunities, and plan learning product experiments.', 'https://images.unsplash.com/photo-1552664730-d307ca884978', (SELECT id FROM auth.users WHERE email = 'product.instructor@sagelms.dev'), 'PUBLISHED', 'Product', NOW() - INTERVAL '15 days', NOW()),
    ('30000000-0000-0000-0000-000000000026', 'Learning Experience Strategy', 'Design course journeys, learner motivation loops, assessments, and completion-oriented interventions.', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f', (SELECT id FROM auth.users WHERE email = 'product.instructor@sagelms.dev'), 'PUBLISHED', 'Education', NOW() - INTERVAL '13 days', NOW()),
    ('30000000-0000-0000-0000-000000000027', 'B2B SaaS Marketing Analytics', 'Measure acquisition, activation, retention, funnels, and growth experiments for SaaS products.', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f', (SELECT id FROM auth.users WHERE email = 'product.instructor@sagelms.dev'), 'PUBLISHED', 'Marketing', NOW() - INTERVAL '11 days', NOW()),
    ('30000000-0000-0000-0000-000000000028', 'No-Code Automation for Ops Teams', 'Automate repetitive operations with forms, spreadsheets, webhooks, and approval workflows.', NULL, (SELECT id FROM auth.users WHERE email = 'product.instructor@sagelms.dev'), 'ARCHIVED', 'Business', NOW() - INTERVAL '45 days', NOW())
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    thumbnail_url = EXCLUDED.thumbnail_url,
    instructor_id = EXCLUDED.instructor_id,
    status = EXCLUDED.status,
    category = EXCLUDED.category,
    updated_at = NOW();

INSERT INTO course.enrollments (
    id,
    course_id,
    student_id,
    enrolled_at,
    status
)
VALUES
    ('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000013', (SELECT id FROM auth.users WHERE email = 'student@sagelms.dev'), NOW() - INTERVAL '8 days', 'ACTIVE'),
    ('40000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000014', (SELECT id FROM auth.users WHERE email = 'student2@sagelms.dev'), NOW() - INTERVAL '7 days', 'ACTIVE'),
    ('40000000-0000-0000-0000-000000000015', '30000000-0000-0000-0000-000000000015', (SELECT id FROM auth.users WHERE email = 'student3@sagelms.dev'), NOW() - INTERVAL '6 days', 'COMPLETED'),
    ('40000000-0000-0000-0000-000000000016', '30000000-0000-0000-0000-000000000017', (SELECT id FROM auth.users WHERE email = 'student@sagelms.dev'), NOW() - INTERVAL '9 days', 'ACTIVE'),
    ('40000000-0000-0000-0000-000000000017', '30000000-0000-0000-0000-000000000018', (SELECT id FROM auth.users WHERE email = 'student3@sagelms.dev'), NOW() - INTERVAL '5 days', 'ACTIVE'),
    ('40000000-0000-0000-0000-000000000018', '30000000-0000-0000-0000-000000000019', (SELECT id FROM auth.users WHERE email = 'student4@sagelms.dev'), NOW() - INTERVAL '4 days', 'ACTIVE'),
    ('40000000-0000-0000-0000-000000000019', '30000000-0000-0000-0000-000000000021', (SELECT id FROM auth.users WHERE email = 'student2@sagelms.dev'), NOW() - INTERVAL '8 days', 'ACTIVE'),
    ('40000000-0000-0000-0000-000000000020', '30000000-0000-0000-0000-000000000022', (SELECT id FROM auth.users WHERE email = 'student3@sagelms.dev'), NOW() - INTERVAL '7 days', 'ACTIVE'),
    ('40000000-0000-0000-0000-000000000021', '30000000-0000-0000-0000-000000000023', (SELECT id FROM auth.users WHERE email = 'student4@sagelms.dev'), NOW() - INTERVAL '6 days', 'DROPPED'),
    ('40000000-0000-0000-0000-000000000022', '30000000-0000-0000-0000-000000000024', (SELECT id FROM auth.users WHERE email = 'student@sagelms.dev'), NOW() - INTERVAL '3 days', 'ACTIVE'),
    ('40000000-0000-0000-0000-000000000023', '30000000-0000-0000-0000-000000000025', (SELECT id FROM auth.users WHERE email = 'student2@sagelms.dev'), NOW() - INTERVAL '5 days', 'ACTIVE'),
    ('40000000-0000-0000-0000-000000000024', '30000000-0000-0000-0000-000000000026', (SELECT id FROM auth.users WHERE email = 'student3@sagelms.dev'), NOW() - INTERVAL '4 days', 'ACTIVE'),
    ('40000000-0000-0000-0000-000000000025', '30000000-0000-0000-0000-000000000027', (SELECT id FROM auth.users WHERE email = 'student4@sagelms.dev'), NOW() - INTERVAL '2 days', 'ACTIVE')
ON CONFLICT (course_id, student_id) DO UPDATE SET
    enrolled_at = EXCLUDED.enrolled_at,
    status = EXCLUDED.status;

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
    ('50000000-0000-0000-0000-000000000034', '30000000-0000-0000-0000-000000000013', (SELECT id FROM auth.users WHERE email = 'frontend.instructor@sagelms.dev'), 'Performance budgets and profiling', 'TEXT', NULL, 'Set performance budgets, profile slow renders, and decide which optimization is worth shipping.', 1, 18, TRUE, NOW() - INTERVAL '17 days', NOW()),
    ('50000000-0000-0000-0000-000000000035', '30000000-0000-0000-0000-000000000013', (SELECT id FROM auth.users WHERE email = 'frontend.instructor@sagelms.dev'), 'React performance checklist', 'PDF', 'https://example.com/sagelms/react-performance-checklist.pdf', NULL, 2, 9, TRUE, NOW() - INTERVAL '16 days', NOW()),
    ('50000000-0000-0000-0000-000000000036', '30000000-0000-0000-0000-000000000014', (SELECT id FROM auth.users WHERE email = 'frontend.instructor@sagelms.dev'), 'Admin table interaction patterns', 'TEXT', NULL, 'Design tables with filters, pagination, row actions, empty states, and permission-aware controls.', 1, 20, TRUE, NOW() - INTERVAL '16 days', NOW()),
    ('50000000-0000-0000-0000-000000000037', '30000000-0000-0000-0000-000000000014', (SELECT id FROM auth.users WHERE email = 'frontend.instructor@sagelms.dev'), 'Dashboard QA walkthrough', 'VIDEO', 'https://example.com/videos/admin-dashboard-qa', NULL, 2, 24, TRUE, NOW() - INTERVAL '15 days', NOW()),
    ('50000000-0000-0000-0000-000000000038', '30000000-0000-0000-0000-000000000015', (SELECT id FROM auth.users WHERE email = 'frontend.instructor@sagelms.dev'), 'Component API design', 'TEXT', NULL, 'Keep component props small, explicit, and aligned with product workflows.', 1, 16, TRUE, NOW() - INTERVAL '15 days', NOW()),
    ('50000000-0000-0000-0000-000000000039', '30000000-0000-0000-0000-000000000015', (SELECT id FROM auth.users WHERE email = 'frontend.instructor@sagelms.dev'), 'Design token examples', 'LINK', 'https://designsystemsrepo.com/design-tokens/', NULL, 2, 6, TRUE, NOW() - INTERVAL '14 days', NOW()),
    ('50000000-0000-0000-0000-000000000040', '30000000-0000-0000-0000-000000000016', (SELECT id FROM auth.users WHERE email = 'frontend.instructor@sagelms.dev'), 'Validation copy draft', 'TEXT', NULL, 'Draft lesson for labels, helper text, validation messages, and empty states.', 1, 12, FALSE, NOW() - INTERVAL '7 days', NOW()),
    ('50000000-0000-0000-0000-000000000041', '30000000-0000-0000-0000-000000000017', (SELECT id FROM auth.users WHERE email = 'data.instructor@sagelms.dev'), 'Notebook workflow setup', 'TEXT', NULL, 'Prepare datasets, notebooks, reproducible steps, and visual checks for analytics work.', 1, 17, TRUE, NOW() - INTERVAL '17 days', NOW()),
    ('50000000-0000-0000-0000-000000000042', '30000000-0000-0000-0000-000000000017', (SELECT id FROM auth.users WHERE email = 'data.instructor@sagelms.dev'), 'Exploratory analysis demo', 'VIDEO', 'https://example.com/videos/python-eda-demo', NULL, 2, 27, TRUE, NOW() - INTERVAL '16 days', NOW()),
    ('50000000-0000-0000-0000-000000000043', '30000000-0000-0000-0000-000000000018', (SELECT id FROM auth.users WHERE email = 'data.instructor@sagelms.dev'), 'Model framing basics', 'TEXT', NULL, 'Turn business questions into model tasks, labels, features, and evaluation criteria.', 1, 21, TRUE, NOW() - INTERVAL '14 days', NOW()),
    ('50000000-0000-0000-0000-000000000044', '30000000-0000-0000-0000-000000000018', (SELECT id FROM auth.users WHERE email = 'data.instructor@sagelms.dev'), 'ML evaluation worksheet', 'PDF', 'https://example.com/sagelms/ml-evaluation.pdf', NULL, 2, 10, TRUE, NOW() - INTERVAL '13 days', NOW()),
    ('50000000-0000-0000-0000-000000000045', '30000000-0000-0000-0000-000000000019', (SELECT id FROM auth.users WHERE email = 'data.instructor@sagelms.dev'), 'Operational SQL patterns', 'TEXT', NULL, 'Use joins, aggregates, windows, and date filters to answer recurring operations questions.', 1, 22, TRUE, NOW() - INTERVAL '12 days', NOW()),
    ('50000000-0000-0000-0000-000000000046', '30000000-0000-0000-0000-000000000019', (SELECT id FROM auth.users WHERE email = 'data.instructor@sagelms.dev'), 'PostgreSQL reporting docs', 'LINK', 'https://www.postgresql.org/docs/current/tutorial-agg.html', NULL, 2, 7, TRUE, NOW() - INTERVAL '11 days', NOW()),
    ('50000000-0000-0000-0000-000000000047', '30000000-0000-0000-0000-000000000020', (SELECT id FROM auth.users WHERE email = 'data.instructor@sagelms.dev'), 'Prompt evaluation draft', 'TEXT', NULL, 'Draft lesson for evaluating AI tutor answers with sample tasks and rubrics.', 1, 18, FALSE, NOW() - INTERVAL '5 days', NOW()),
    ('50000000-0000-0000-0000-000000000048', '30000000-0000-0000-0000-000000000021', (SELECT id FROM auth.users WHERE email = 'devops.instructor@sagelms.dev'), 'Deployment manifest basics', 'TEXT', NULL, 'Define deployments, services, probes, config maps, secrets, and rollout expectations.', 1, 20, TRUE, NOW() - INTERVAL '18 days', NOW()),
    ('50000000-0000-0000-0000-000000000049', '30000000-0000-0000-0000-000000000021', (SELECT id FROM auth.users WHERE email = 'devops.instructor@sagelms.dev'), 'Kubernetes docs map', 'LINK', 'https://kubernetes.io/docs/home/', NULL, 2, 6, TRUE, NOW() - INTERVAL '17 days', NOW()),
    ('50000000-0000-0000-0000-000000000050', '30000000-0000-0000-0000-000000000022', (SELECT id FROM auth.users WHERE email = 'devops.instructor@sagelms.dev'), 'CI pipeline stages', 'TEXT', NULL, 'Design pipeline stages for linting, type checks, tests, builds, container images, and deployment checks.', 1, 19, TRUE, NOW() - INTERVAL '13 days', NOW()),
    ('50000000-0000-0000-0000-000000000051', '30000000-0000-0000-0000-000000000022', (SELECT id FROM auth.users WHERE email = 'devops.instructor@sagelms.dev'), 'Branch protection checklist', 'PDF', 'https://example.com/sagelms/branch-protection-checklist.pdf', NULL, 2, 8, TRUE, NOW() - INTERVAL '12 days', NOW()),
    ('50000000-0000-0000-0000-000000000052', '30000000-0000-0000-0000-000000000023', (SELECT id FROM auth.users WHERE email = 'devops.instructor@sagelms.dev'), 'Logs metrics and traces', 'TEXT', NULL, 'Choose useful logs, metrics, and traces for debugging a course/content/auth request path.', 1, 21, TRUE, NOW() - INTERVAL '11 days', NOW()),
    ('50000000-0000-0000-0000-000000000053', '30000000-0000-0000-0000-000000000023', (SELECT id FROM auth.users WHERE email = 'devops.instructor@sagelms.dev'), 'Incident review template', 'PDF', 'https://example.com/sagelms/incident-review-template.pdf', NULL, 2, 9, TRUE, NOW() - INTERVAL '10 days', NOW()),
    ('50000000-0000-0000-0000-000000000054', '30000000-0000-0000-0000-000000000024', (SELECT id FROM auth.users WHERE email = 'devops.instructor@sagelms.dev'), 'Secrets and least privilege', 'TEXT', NULL, 'Apply least privilege to service secrets, environment variables, and internal network boundaries.', 1, 18, TRUE, NOW() - INTERVAL '9 days', NOW()),
    ('50000000-0000-0000-0000-000000000055', '30000000-0000-0000-0000-000000000024', (SELECT id FROM auth.users WHERE email = 'devops.instructor@sagelms.dev'), 'Cloud security reference', 'LINK', 'https://owasp.org/www-project-cloud-native-application-security-top-10/', NULL, 2, 7, TRUE, NOW() - INTERVAL '8 days', NOW()),
    ('50000000-0000-0000-0000-000000000056', '30000000-0000-0000-0000-000000000025', (SELECT id FROM auth.users WHERE email = 'product.instructor@sagelms.dev'), 'Opportunity discovery interviews', 'TEXT', NULL, 'Plan interviews, map assumptions, and synthesize learning product opportunities.', 1, 16, TRUE, NOW() - INTERVAL '14 days', NOW()),
    ('50000000-0000-0000-0000-000000000057', '30000000-0000-0000-0000-000000000025', (SELECT id FROM auth.users WHERE email = 'product.instructor@sagelms.dev'), 'Discovery planning canvas', 'PDF', 'https://example.com/sagelms/discovery-canvas.pdf', NULL, 2, 8, TRUE, NOW() - INTERVAL '13 days', NOW()),
    ('50000000-0000-0000-0000-000000000058', '30000000-0000-0000-0000-000000000026', (SELECT id FROM auth.users WHERE email = 'product.instructor@sagelms.dev'), 'Course journey mapping', 'TEXT', NULL, 'Map learner motivations, blockers, completion moments, and support interventions.', 1, 18, TRUE, NOW() - INTERVAL '12 days', NOW()),
    ('50000000-0000-0000-0000-000000000059', '30000000-0000-0000-0000-000000000026', (SELECT id FROM auth.users WHERE email = 'product.instructor@sagelms.dev'), 'Learning motivation notes', 'LINK', 'https://www.edutopia.org/topic/student-engagement/', NULL, 2, 6, TRUE, NOW() - INTERVAL '11 days', NOW()),
    ('50000000-0000-0000-0000-000000000060', '30000000-0000-0000-0000-000000000027', (SELECT id FROM auth.users WHERE email = 'product.instructor@sagelms.dev'), 'SaaS funnel metrics', 'TEXT', NULL, 'Measure acquisition, activation, expansion, retention, and experiment impact.', 1, 20, TRUE, NOW() - INTERVAL '10 days', NOW()),
    ('50000000-0000-0000-0000-000000000061', '30000000-0000-0000-0000-000000000027', (SELECT id FROM auth.users WHERE email = 'product.instructor@sagelms.dev'), 'Growth experiment brief', 'PDF', 'https://example.com/sagelms/growth-experiment-brief.pdf', NULL, 2, 9, TRUE, NOW() - INTERVAL '9 days', NOW()),
    ('50000000-0000-0000-0000-000000000062', '30000000-0000-0000-0000-000000000028', (SELECT id FROM auth.users WHERE email = 'product.instructor@sagelms.dev'), 'Automation inventory', 'TEXT', NULL, 'Archived lesson for mapping repetitive operations work into automation opportunities.', 1, 13, TRUE, NOW() - INTERVAL '44 days', NOW()),
    ('50000000-0000-0000-0000-000000000063', '30000000-0000-0000-0000-000000000028', (SELECT id FROM auth.users WHERE email = 'product.instructor@sagelms.dev'), 'Approval workflow reference', 'LINK', 'https://zapier.com/blog/approval-workflow/', NULL, 2, 7, TRUE, NOW() - INTERVAL '43 days', NOW())
ON CONFLICT (course_id, sort_order) WHERE is_deleted = FALSE DO UPDATE SET
    course_id = EXCLUDED.course_id,
    instructor_id = EXCLUDED.instructor_id,
    title = EXCLUDED.title,
    type = EXCLUDED.type,
    content_url = EXCLUDED.content_url,
    text_content = EXCLUDED.text_content,
    sort_order = EXCLUDED.sort_order,
    duration_minutes = EXCLUDED.duration_minutes,
    is_published = EXCLUDED.is_published,
    is_deleted = FALSE,
    updated_at = NOW();

UPDATE course.courses
SET enrollment_policy = 'APPROVAL_REQUIRED',
    updated_at = NOW()
WHERE id IN (
    '30000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000014',
    '30000000-0000-0000-0000-000000000018',
    '30000000-0000-0000-0000-000000000024',
    '30000000-0000-0000-0000-000000000026'
);

UPDATE course.enrollments
SET status = 'PENDING'
WHERE id IN (
    '40000000-0000-0000-0000-000000000014',
    '40000000-0000-0000-0000-000000000017',
    '40000000-0000-0000-0000-000000000022'
);

INSERT INTO auth.notification_preferences (
    user_id,
    in_app_enabled,
    email_enabled,
    enrollment_requests,
    enrollment_results,
    course_updates,
    created_at,
    updated_at
)
SELECT
    id,
    TRUE,
    FALSE,
    TRUE,
    TRUE,
    TRUE,
    NOW(),
    NOW()
FROM auth.users
WHERE email IN (
    'admin@sagelms.dev',
    'instructor@sagelms.dev',
    'frontend.instructor@sagelms.dev',
    'data.instructor@sagelms.dev',
    'student@sagelms.dev',
    'student2@sagelms.dev'
)
ON CONFLICT (user_id) DO UPDATE SET
    in_app_enabled = EXCLUDED.in_app_enabled,
    enrollment_requests = EXCLUDED.enrollment_requests,
    enrollment_results = EXCLUDED.enrollment_results,
    course_updates = EXCLUDED.course_updates,
    updated_at = NOW();

INSERT INTO auth.notifications (
    id,
    user_id,
    type,
    title,
    message,
    target_url,
    is_read,
    created_at,
    updated_at
)
VALUES
    (
        '60000000-0000-0000-0000-000000000001',
        (SELECT id FROM auth.users WHERE email = 'frontend.instructor@sagelms.dev'),
        'ENROLLMENT_REQUESTED',
        'Có yêu cầu ghi danh mới',
        'Second Student muốn ghi danh khóa Admin UX Patterns.',
        '/courses/30000000-0000-0000-0000-000000000014',
        FALSE,
        NOW() - INTERVAL '2 hours',
        NOW()
    ),
    (
        '60000000-0000-0000-0000-000000000002',
        (SELECT id FROM auth.users WHERE email = 'data.instructor@sagelms.dev'),
        'ENROLLMENT_REQUESTED',
        'Có yêu cầu ghi danh mới',
        'Student Three muốn ghi danh khóa Machine Learning Basics for Product Teams.',
        '/courses/30000000-0000-0000-0000-000000000018',
        FALSE,
        NOW() - INTERVAL '3 hours',
        NOW()
    ),
    (
        '60000000-0000-0000-0000-000000000003',
        (SELECT id FROM auth.users WHERE email = 'student@sagelms.dev'),
        'COURSE_ENROLLED',
        'Bạn đã ghi danh thành công',
        'Bạn có thể tiếp tục học Cloud Security Essentials.',
        '/courses/30000000-0000-0000-0000-000000000024',
        FALSE,
        NOW() - INTERVAL '1 hour',
        NOW()
    ),
    (
        '60000000-0000-0000-0000-000000000004',
        (SELECT id FROM auth.users WHERE email = 'student2@sagelms.dev'),
        'ENROLLMENT_APPROVED',
        'Yêu cầu ghi danh đã được duyệt',
        'Bạn đã được duyệt vào khóa CI/CD Quality Gates.',
        '/courses/30000000-0000-0000-0000-000000000022',
        TRUE,
        NOW() - INTERVAL '1 day',
        NOW()
    ),
    (
        '60000000-0000-0000-0000-000000000005',
        (SELECT id FROM auth.users WHERE email = 'student3@sagelms.dev'),
        'ENROLLMENT_REJECTED',
        'Yêu cầu ghi danh bị từ chối',
        'Giảng viên cần bạn bổ sung nền tảng JavaScript trước khi tham gia khóa này.',
        '/courses/30000000-0000-0000-0000-000000000014',
        FALSE,
        NOW() - INTERVAL '4 hours',
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    type = EXCLUDED.type,
    title = EXCLUDED.title,
    message = EXCLUDED.message,
    target_url = EXCLUDED.target_url,
    is_read = EXCLUDED.is_read,
    updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Challenge service demo data
-- ---------------------------------------------------------------------------

INSERT INTO challenge.challenges (
    id,
    title,
    description,
    thumbnail_url,
    category,
    status,
    instructor_id,
    time_limit_minutes,
    max_attempts,
    created_at,
    updated_at
) VALUES
    (
        '70000000-0000-0000-0000-000000000001',
        'React Fundamentals Challenge',
        'Kiểm tra kiến thức React: component, state, props, hook và cách xử lý render.',
        'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
        'Web Development',
        'PUBLISHED',
        (SELECT id FROM auth.users WHERE email = 'frontend.instructor@sagelms.dev'),
        35,
        1,
        NOW() - INTERVAL '14 days',
        NOW()
    ),
    (
        '70000000-0000-0000-0000-000000000002',
        'SQL Analytics Sprint',
        'Thử thách phân tích dữ liệu bằng SQL: join, aggregate, cohort và truy vấn báo cáo.',
        'https://images.unsplash.com/photo-1544383835-bda2bc66a55d',
        'Database',
        'PUBLISHED',
        (SELECT id FROM auth.users WHERE email = 'data.instructor@sagelms.dev'),
        45,
        1,
        NOW() - INTERVAL '12 days',
        NOW()
    ),
    (
        '70000000-0000-0000-0000-000000000003',
        'DevOps Incident Response Drill',
        'Bài luyện xử lý sự cố: đọc tín hiệu hệ thống, xác định tác động, rollback và viết incident note.',
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31',
        'DevOps',
        'PUBLISHED',
        (SELECT id FROM auth.users WHERE email = 'devops.instructor@sagelms.dev'),
        50,
        1,
        NOW() - INTERVAL '10 days',
        NOW()
    ),
    (
        '70000000-0000-0000-0000-000000000004',
        'Product Discovery Case Study',
        'Tự luận và trắc nghiệm về phỏng vấn người dùng, cơ hội sản phẩm và ưu tiên MVP.',
        'https://images.unsplash.com/photo-1552664730-d307ca884978',
        'Product',
        'PUBLISHED',
        (SELECT id FROM auth.users WHERE email = 'product.instructor@sagelms.dev'),
        40,
        1,
        NOW() - INTERVAL '9 days',
        NOW()
    ),
    (
        '70000000-0000-0000-0000-000000000005',
        'AI Tutor Prompt Review',
        'Đánh giá prompt, guardrail, rubric và chất lượng phản hồi của AI tutor.',
        'https://images.unsplash.com/photo-1677442136019-21780ecad995',
        'AI',
        'PUBLISHED',
        (SELECT id FROM auth.users WHERE email = 'data.instructor@sagelms.dev'),
        30,
        1,
        NOW() - INTERVAL '7 days',
        NOW()
    ),
    (
        '70000000-0000-0000-0000-000000000006',
        'Learning UX Draft Challenge',
        'Bản nháp thử thách nội bộ cho thiết kế trải nghiệm học tập.',
        NULL,
        'Education',
        'DRAFT',
        (SELECT id FROM auth.users WHERE email = 'product.instructor@sagelms.dev'),
        25,
        1,
        NOW() - INTERVAL '3 days',
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    thumbnail_url = EXCLUDED.thumbnail_url,
    category = EXCLUDED.category,
    status = EXCLUDED.status,
    instructor_id = EXCLUDED.instructor_id,
    time_limit_minutes = EXCLUDED.time_limit_minutes,
    max_attempts = EXCLUDED.max_attempts,
    updated_at = NOW();

INSERT INTO challenge.challenge_question_sets (
    id,
    challenge_id,
    title,
    time_limit_minutes,
    sort_order,
    created_at,
    updated_at
) VALUES
    ('71000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'React Core Concepts', 18, 0, NOW() - INTERVAL '14 days', NOW()),
    ('71000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'React Debugging Scenario', 17, 1, NOW() - INTERVAL '14 days', NOW()),
    ('71000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000002', 'SQL Query Basics', 20, 0, NOW() - INTERVAL '12 days', NOW()),
    ('71000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000002', 'Analytics Case Essay', 25, 1, NOW() - INTERVAL '12 days', NOW()),
    ('71000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000003', 'Incident Triage', 25, 0, NOW() - INTERVAL '10 days', NOW()),
    ('71000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000004', 'Discovery and Prioritization', 40, 0, NOW() - INTERVAL '9 days', NOW()),
    ('71000000-0000-0000-0000-000000000007', '70000000-0000-0000-0000-000000000005', 'Prompt Quality Review', 30, 0, NOW() - INTERVAL '7 days', NOW()),
    ('71000000-0000-0000-0000-000000000008', '70000000-0000-0000-0000-000000000006', 'Learning UX Draft Set', 25, 0, NOW() - INTERVAL '3 days', NOW()),
    ('71000000-0000-0000-0000-000000000009', '70000000-0000-0000-0000-000000000003', 'Postmortem Writing', 25, 1, NOW() - INTERVAL '9 days', NOW())
ON CONFLICT (id) DO UPDATE SET
    challenge_id = EXCLUDED.challenge_id,
    title = EXCLUDED.title,
    time_limit_minutes = EXCLUDED.time_limit_minutes,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

INSERT INTO challenge.challenge_questions (
    id,
    challenge_id,
    question_set_id,
    title,
    prompt,
    type,
    media_type,
    media_url,
    points,
    sort_order,
    created_at,
    updated_at
) VALUES
    ('72000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', 'State update', 'Trong React, cách nào là đúng để cập nhật state dựa trên giá trị trước đó?', 'MULTIPLE_CHOICE', 'NONE', NULL, 1.00, 0, NOW() - INTERVAL '14 days', NOW()),
    ('72000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', 'Effect dependency', 'Dependency array của useEffect dùng để làm gì?', 'MULTIPLE_CHOICE', 'NONE', NULL, 1.00, 1, NOW() - INTERVAL '14 days', NOW()),
    ('72000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', 'Component boundary', 'Giải thích khi nào nên tách một component React thành component nhỏ hơn.', 'ESSAY', 'NONE', NULL, 2.00, 2, NOW() - INTERVAL '14 days', NOW()),
    ('72000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000002', 'Render loop', 'Một component bị render liên tục sau khi gọi setState trong useEffect. Bạn sẽ debug theo các bước nào?', 'ESSAY', 'NONE', NULL, 3.00, 0, NOW() - INTERVAL '13 days', NOW()),
    ('72000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000002', 'Memo usage', 'React.memo phù hợp nhất trong trường hợp nào?', 'MULTIPLE_CHOICE', 'NONE', NULL, 1.00, 1, NOW() - INTERVAL '13 days', NOW()),
    ('72000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000003', 'SQL join', 'Loại JOIN nào giữ tất cả dòng từ bảng bên trái?', 'MULTIPLE_CHOICE', 'NONE', NULL, 1.00, 0, NOW() - INTERVAL '12 days', NOW()),
    ('72000000-0000-0000-0000-000000000007', '70000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000003', 'Aggregation', 'Hàm SQL nào thường dùng để đếm số dòng?', 'MULTIPLE_CHOICE', 'NONE', NULL, 1.00, 1, NOW() - INTERVAL '12 days', NOW()),
    ('72000000-0000-0000-0000-000000000008', '70000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000003', 'Window function', 'Nêu một ví dụ sử dụng window function trong báo cáo vận hành.', 'ESSAY', 'NONE', NULL, 2.00, 2, NOW() - INTERVAL '12 days', NOW()),
    ('72000000-0000-0000-0000-000000000009', '70000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000004', 'Cohort analysis', 'Thiết kế truy vấn cohort retention cho học viên theo tuần ghi danh. Hãy mô tả bảng đầu vào và output kỳ vọng.', 'ESSAY', 'NONE', NULL, 4.00, 0, NOW() - INTERVAL '11 days', NOW()),
    ('72000000-0000-0000-0000-000000000010', '70000000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000005', 'First response', 'Khi production error tăng đột biến, bước đầu tiên nên là gì?', 'MULTIPLE_CHOICE', 'NONE', NULL, 1.00, 0, NOW() - INTERVAL '10 days', NOW()),
    ('72000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000005', 'Rollback decision', 'Nêu tiêu chí quyết định rollback một release.', 'ESSAY', 'NONE', NULL, 3.00, 1, NOW() - INTERVAL '10 days', NOW()),
    ('72000000-0000-0000-0000-000000000012', '70000000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000009', 'Postmortem content', 'Postmortem tốt nên có nội dung nào?', 'MULTIPLE_CHOICE', 'NONE', NULL, 1.00, 0, NOW() - INTERVAL '9 days', NOW()),
    ('72000000-0000-0000-0000-000000000013', '70000000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000009', 'Action items', 'Viết 3 action item sau sự cố gateway timeout, có owner và tiêu chí hoàn thành.', 'ESSAY', 'NONE', NULL, 3.00, 1, NOW() - INTERVAL '9 days', NOW()),
    ('72000000-0000-0000-0000-000000000014', '70000000-0000-0000-0000-000000000004', '71000000-0000-0000-0000-000000000006', 'Interview goal', 'Mục tiêu chính của discovery interview là gì?', 'MULTIPLE_CHOICE', 'NONE', NULL, 1.00, 0, NOW() - INTERVAL '9 days', NOW()),
    ('72000000-0000-0000-0000-000000000015', '70000000-0000-0000-0000-000000000004', '71000000-0000-0000-0000-000000000006', 'MVP priority', 'Bạn có 5 vấn đề người dùng. Hãy mô tả cách ưu tiên cho MVP đầu tiên.', 'ESSAY', 'NONE', NULL, 3.00, 1, NOW() - INTERVAL '9 days', NOW()),
    ('72000000-0000-0000-0000-000000000016', '70000000-0000-0000-0000-000000000004', '71000000-0000-0000-0000-000000000006', 'Opportunity sizing', 'Impact/Effort matrix dùng để làm gì?', 'MULTIPLE_CHOICE', 'NONE', NULL, 1.00, 2, NOW() - INTERVAL '9 days', NOW()),
    ('72000000-0000-0000-0000-000000000017', '70000000-0000-0000-0000-000000000005', '71000000-0000-0000-0000-000000000007', 'Prompt guardrail', 'Guardrail trong prompt AI tutor có tác dụng gì?', 'MULTIPLE_CHOICE', 'NONE', NULL, 1.00, 0, NOW() - INTERVAL '7 days', NOW()),
    ('72000000-0000-0000-0000-000000000018', '70000000-0000-0000-0000-000000000005', '71000000-0000-0000-0000-000000000007', 'Rubric design', 'Thiết kế rubric 3 tiêu chí để đánh giá câu trả lời của AI tutor.', 'ESSAY', 'NONE', NULL, 3.00, 1, NOW() - INTERVAL '7 days', NOW()),
    ('72000000-0000-0000-0000-000000000019', '70000000-0000-0000-0000-000000000005', '71000000-0000-0000-0000-000000000007', 'Evaluation sample', 'Một bộ evaluation tốt nên có gì?', 'MULTIPLE_CHOICE', 'NONE', NULL, 1.00, 2, NOW() - INTERVAL '7 days', NOW()),
    ('72000000-0000-0000-0000-000000000020', '70000000-0000-0000-0000-000000000006', '71000000-0000-0000-0000-000000000008', 'Learner motivation', 'Nêu 2 tín hiệu cho thấy học viên đang mất động lực trong khóa học.', 'ESSAY', 'NONE', NULL, 2.00, 0, NOW() - INTERVAL '3 days', NOW())
ON CONFLICT (id) DO UPDATE SET
    challenge_id = EXCLUDED.challenge_id,
    question_set_id = EXCLUDED.question_set_id,
    title = EXCLUDED.title,
    prompt = EXCLUDED.prompt,
    type = EXCLUDED.type,
    media_type = EXCLUDED.media_type,
    media_url = EXCLUDED.media_url,
    points = EXCLUDED.points,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

INSERT INTO challenge.challenge_choices (
    id,
    question_id,
    text,
    is_correct,
    sort_order
) VALUES
    ('73000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000001', 'setCount(count + 1) trong mọi trường hợp', FALSE, 0),
    ('73000000-0000-0000-0000-000000000002', '72000000-0000-0000-0000-000000000001', 'setCount((current) => current + 1)', TRUE, 1),
    ('73000000-0000-0000-0000-000000000003', '72000000-0000-0000-0000-000000000001', 'Gán trực tiếp count = count + 1', FALSE, 2),
    ('73000000-0000-0000-0000-000000000004', '72000000-0000-0000-0000-000000000002', 'Kiểm soát khi effect chạy lại theo dữ liệu phụ thuộc', TRUE, 0),
    ('73000000-0000-0000-0000-000000000005', '72000000-0000-0000-0000-000000000002', 'Tự động cache component', FALSE, 1),
    ('73000000-0000-0000-0000-000000000006', '72000000-0000-0000-0000-000000000002', 'Thay thế hoàn toàn useState', FALSE, 2),
    ('73000000-0000-0000-0000-000000000007', '72000000-0000-0000-0000-000000000005', 'Component nhận props ổn định và render tốn chi phí', TRUE, 0),
    ('73000000-0000-0000-0000-000000000008', '72000000-0000-0000-0000-000000000005', 'Mọi component đều nên bọc memo', FALSE, 1),
    ('73000000-0000-0000-0000-000000000009', '72000000-0000-0000-0000-000000000005', 'Chỉ dùng cho form input controlled', FALSE, 2),
    ('73000000-0000-0000-0000-000000000010', '72000000-0000-0000-0000-000000000006', 'INNER JOIN', FALSE, 0),
    ('73000000-0000-0000-0000-000000000011', '72000000-0000-0000-0000-000000000006', 'LEFT JOIN', TRUE, 1),
    ('73000000-0000-0000-0000-000000000012', '72000000-0000-0000-0000-000000000006', 'CROSS JOIN', FALSE, 2),
    ('73000000-0000-0000-0000-000000000013', '72000000-0000-0000-0000-000000000007', 'COUNT(*)', TRUE, 0),
    ('73000000-0000-0000-0000-000000000014', '72000000-0000-0000-0000-000000000007', 'AVG(*)', FALSE, 1),
    ('73000000-0000-0000-0000-000000000015', '72000000-0000-0000-0000-000000000007', 'GROUP(*)', FALSE, 2),
    ('73000000-0000-0000-0000-000000000016', '72000000-0000-0000-0000-000000000010', 'Tắt toàn bộ hệ thống ngay lập tức', FALSE, 0),
    ('73000000-0000-0000-0000-000000000017', '72000000-0000-0000-0000-000000000010', 'Xác nhận phạm vi ảnh hưởng và bảo vệ người dùng', TRUE, 1),
    ('73000000-0000-0000-0000-000000000018', '72000000-0000-0000-0000-000000000010', 'Viết postmortem trước khi xử lý', FALSE, 2),
    ('73000000-0000-0000-0000-000000000019', '72000000-0000-0000-0000-000000000012', 'Timeline, impact, root cause, action items', TRUE, 0),
    ('73000000-0000-0000-0000-000000000020', '72000000-0000-0000-0000-000000000012', 'Chỉ liệt kê ai gây lỗi', FALSE, 1),
    ('73000000-0000-0000-0000-000000000021', '72000000-0000-0000-0000-000000000012', 'Chỉ ghi log raw', FALSE, 2),
    ('73000000-0000-0000-0000-000000000022', '72000000-0000-0000-0000-000000000014', 'Xác thực giả định và hiểu vấn đề người dùng', TRUE, 0),
    ('73000000-0000-0000-0000-000000000023', '72000000-0000-0000-0000-000000000014', 'Bán sản phẩm ngay trong buổi phỏng vấn', FALSE, 1),
    ('73000000-0000-0000-0000-000000000024', '72000000-0000-0000-0000-000000000014', 'Ép người dùng chọn feature team thích', FALSE, 2),
    ('73000000-0000-0000-0000-000000000025', '72000000-0000-0000-0000-000000000016', 'So sánh tác động và công sức để ưu tiên', TRUE, 0),
    ('73000000-0000-0000-0000-000000000026', '72000000-0000-0000-0000-000000000016', 'Tự động tính giá bán', FALSE, 1),
    ('73000000-0000-0000-0000-000000000027', '72000000-0000-0000-0000-000000000016', 'Thay thế toàn bộ roadmap', FALSE, 2),
    ('73000000-0000-0000-0000-000000000028', '72000000-0000-0000-0000-000000000017', 'Giới hạn hành vi, phạm vi và tiêu chí trả lời an toàn', TRUE, 0),
    ('73000000-0000-0000-0000-000000000029', '72000000-0000-0000-0000-000000000017', 'Làm model trả lời dài hơn', FALSE, 1),
    ('73000000-0000-0000-0000-000000000030', '72000000-0000-0000-0000-000000000017', 'Tăng số token mặc định', FALSE, 2),
    ('73000000-0000-0000-0000-000000000031', '72000000-0000-0000-0000-000000000019', 'Case đa dạng, expected behavior, rubric và dữ liệu edge case', TRUE, 0),
    ('73000000-0000-0000-0000-000000000032', '72000000-0000-0000-0000-000000000019', 'Chỉ một câu hỏi dễ', FALSE, 1),
    ('73000000-0000-0000-0000-000000000033', '72000000-0000-0000-0000-000000000019', 'Không cần tiêu chí đánh giá', FALSE, 2)
ON CONFLICT (id) DO UPDATE SET
    question_id = EXCLUDED.question_id,
    text = EXCLUDED.text,
    is_correct = EXCLUDED.is_correct,
    sort_order = EXCLUDED.sort_order;

INSERT INTO challenge.challenge_attempts (
    id,
    challenge_id,
    question_set_id,
    participant_id,
    participant_email,
    score,
    max_score,
    passed,
    grading_status,
    graded_at,
    graded_by,
    started_at,
    submitted_at
) VALUES
    ('74000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', (SELECT id FROM auth.users WHERE email = 'student@sagelms.dev'), 'student@sagelms.dev', 4.00, 4.00, TRUE, 'GRADED', NOW() - INTERVAL '6 days', (SELECT id FROM auth.users WHERE email = 'frontend.instructor@sagelms.dev'), NOW() - INTERVAL '6 days 1 hour', NOW() - INTERVAL '6 days'),
    ('74000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000002', (SELECT id FROM auth.users WHERE email = 'student2@sagelms.dev'), 'student2@sagelms.dev', NULL, 4.00, NULL, 'PENDING_REVIEW', NULL, NULL, NOW() - INTERVAL '2 days 2 hours', NOW() - INTERVAL '2 days'),
    ('74000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000003', (SELECT id FROM auth.users WHERE email = 'student3@sagelms.dev'), 'student3@sagelms.dev', 2.00, 4.00, FALSE, 'GRADED', NOW() - INTERVAL '4 days', (SELECT id FROM auth.users WHERE email = 'data.instructor@sagelms.dev'), NOW() - INTERVAL '4 days 1 hour', NOW() - INTERVAL '4 days'),
    ('74000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000004', (SELECT id FROM auth.users WHERE email = 'student4@sagelms.dev'), 'student4@sagelms.dev', NULL, 4.00, NULL, 'PENDING_REVIEW', NULL, NULL, NOW() - INTERVAL '1 day 3 hours', NOW() - INTERVAL '1 day'),
    ('74000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000005', (SELECT id FROM auth.users WHERE email = 'student@sagelms.dev'), 'student@sagelms.dev', 3.00, 4.00, TRUE, 'GRADED', NOW() - INTERVAL '3 days', (SELECT id FROM auth.users WHERE email = 'devops.instructor@sagelms.dev'), NOW() - INTERVAL '3 days 1 hour', NOW() - INTERVAL '3 days'),
    ('74000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000004', '71000000-0000-0000-0000-000000000006', (SELECT id FROM auth.users WHERE email = 'student2@sagelms.dev'), 'student2@sagelms.dev', 4.00, 5.00, TRUE, 'GRADED', NOW() - INTERVAL '2 days', (SELECT id FROM auth.users WHERE email = 'product.instructor@sagelms.dev'), NOW() - INTERVAL '2 days 1 hour', NOW() - INTERVAL '2 days'),
    ('74000000-0000-0000-0000-000000000007', '70000000-0000-0000-0000-000000000005', '71000000-0000-0000-0000-000000000007', (SELECT id FROM auth.users WHERE email = 'student3@sagelms.dev'), 'student3@sagelms.dev', NULL, 5.00, NULL, 'PENDING_REVIEW', NULL, NULL, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '7 hours'),
    ('74000000-0000-0000-0000-000000000008', '70000000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000009', (SELECT id FROM auth.users WHERE email = 'student4@sagelms.dev'), 'student4@sagelms.dev', 3.00, 4.00, TRUE, 'GRADED', NOW() - INTERVAL '1 day', (SELECT id FROM auth.users WHERE email = 'devops.instructor@sagelms.dev'), NOW() - INTERVAL '1 day 1 hour', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET
    challenge_id = EXCLUDED.challenge_id,
    question_set_id = EXCLUDED.question_set_id,
    participant_id = EXCLUDED.participant_id,
    participant_email = EXCLUDED.participant_email,
    score = EXCLUDED.score,
    max_score = EXCLUDED.max_score,
    passed = EXCLUDED.passed,
    grading_status = EXCLUDED.grading_status,
    graded_at = EXCLUDED.graded_at,
    graded_by = EXCLUDED.graded_by,
    started_at = EXCLUDED.started_at,
    submitted_at = EXCLUDED.submitted_at;

INSERT INTO challenge.challenge_answers (
    id,
    attempt_id,
    question_id,
    choice_id,
    text_answer,
    file_name,
    file_type,
    file_size,
    file_url,
    is_correct
) VALUES
    ('75000000-0000-0000-0000-000000000001', '74000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000001', '73000000-0000-0000-0000-000000000002', NULL, NULL, NULL, NULL, NULL, TRUE),
    ('75000000-0000-0000-0000-000000000002', '74000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000002', '73000000-0000-0000-0000-000000000004', NULL, NULL, NULL, NULL, NULL, TRUE),
    ('75000000-0000-0000-0000-000000000003', '74000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000003', NULL, 'Tách component khi phần UI có trách nhiệm riêng, được tái sử dụng, hoặc component cha quá dài và khó kiểm thử.', NULL, NULL, NULL, NULL, TRUE),
    ('75000000-0000-0000-0000-000000000004', '74000000-0000-0000-0000-000000000002', '72000000-0000-0000-0000-000000000004', NULL, 'Kiểm tra dependency array, tìm setState chạy mỗi render, dùng React DevTools profiler và tách side effect khỏi render path.', 'react-debug-notes.md', 'text/markdown', 2048, 'demo-local://answers/react-debug-notes.md', NULL),
    ('75000000-0000-0000-0000-000000000005', '74000000-0000-0000-0000-000000000002', '72000000-0000-0000-0000-000000000005', '73000000-0000-0000-0000-000000000007', NULL, NULL, NULL, NULL, NULL, TRUE),
    ('75000000-0000-0000-0000-000000000006', '74000000-0000-0000-0000-000000000003', '72000000-0000-0000-0000-000000000006', '73000000-0000-0000-0000-000000000011', NULL, NULL, NULL, NULL, NULL, TRUE),
    ('75000000-0000-0000-0000-000000000007', '74000000-0000-0000-0000-000000000003', '72000000-0000-0000-0000-000000000007', '73000000-0000-0000-0000-000000000014', NULL, NULL, NULL, NULL, NULL, FALSE),
    ('75000000-0000-0000-0000-000000000008', '74000000-0000-0000-0000-000000000003', '72000000-0000-0000-0000-000000000008', NULL, 'Dùng ROW_NUMBER hoặc SUM() OVER(PARTITION BY learner_id ORDER BY week) để tính thứ tự tuần học.', NULL, NULL, NULL, NULL, FALSE),
    ('75000000-0000-0000-0000-000000000009', '74000000-0000-0000-0000-000000000004', '72000000-0000-0000-0000-000000000009', NULL, 'Cần bảng enrollments, lesson_events và calendar tuần. Output gồm cohort_week, active_week, retained_learners và retention_rate.', 'cohort-query.sql', 'text/plain', 3072, 'demo-local://answers/cohort-query.sql', NULL),
    ('75000000-0000-0000-0000-000000000010', '74000000-0000-0000-0000-000000000005', '72000000-0000-0000-0000-000000000010', '73000000-0000-0000-0000-000000000017', NULL, NULL, NULL, NULL, NULL, TRUE),
    ('75000000-0000-0000-0000-000000000011', '74000000-0000-0000-0000-000000000005', '72000000-0000-0000-0000-000000000011', NULL, 'Rollback khi lỗi ảnh hưởng người dùng thật, không thể hotfix nhanh, có bản trước ổn định và dữ liệu không bị rủi ro khi quay lại.', NULL, NULL, NULL, NULL, TRUE),
    ('75000000-0000-0000-0000-000000000012', '74000000-0000-0000-0000-000000000006', '72000000-0000-0000-0000-000000000014', '73000000-0000-0000-0000-000000000022', NULL, NULL, NULL, NULL, NULL, TRUE),
    ('75000000-0000-0000-0000-000000000013', '74000000-0000-0000-0000-000000000006', '72000000-0000-0000-0000-000000000015', NULL, 'Ưu tiên theo mức đau, tần suất, khả năng tạo learning loop, effort thấp và có thể validate trong 1-2 tuần.', NULL, NULL, NULL, NULL, TRUE),
    ('75000000-0000-0000-0000-000000000014', '74000000-0000-0000-0000-000000000006', '72000000-0000-0000-0000-000000000016', '73000000-0000-0000-0000-000000000025', NULL, NULL, NULL, NULL, NULL, TRUE),
    ('75000000-0000-0000-0000-000000000015', '74000000-0000-0000-0000-000000000007', '72000000-0000-0000-0000-000000000017', '73000000-0000-0000-0000-000000000028', NULL, NULL, NULL, NULL, NULL, TRUE),
    ('75000000-0000-0000-0000-000000000016', '74000000-0000-0000-0000-000000000007', '72000000-0000-0000-0000-000000000018', NULL, 'Rubric: đúng nội dung khóa học, đưa phản hồi từng bước, từ chối nội dung ngoài phạm vi hoặc không an toàn.', 'ai-rubric.md', 'text/markdown', 1900, 'demo-local://answers/ai-rubric.md', NULL),
    ('75000000-0000-0000-0000-000000000017', '74000000-0000-0000-0000-000000000007', '72000000-0000-0000-0000-000000000019', '73000000-0000-0000-0000-000000000031', NULL, NULL, NULL, NULL, NULL, TRUE),
    ('75000000-0000-0000-0000-000000000018', '74000000-0000-0000-0000-000000000008', '72000000-0000-0000-0000-000000000012', '73000000-0000-0000-0000-000000000019', NULL, NULL, NULL, NULL, NULL, TRUE),
    ('75000000-0000-0000-0000-000000000019', '74000000-0000-0000-0000-000000000008', '72000000-0000-0000-0000-000000000013', NULL, '1. Owner gateway: thêm timeout dashboard. 2. Owner backend: runbook rollback. 3. Owner QA: smoke test route quan trọng.', NULL, NULL, NULL, NULL, TRUE)
ON CONFLICT (id) DO UPDATE SET
    attempt_id = EXCLUDED.attempt_id,
    question_id = EXCLUDED.question_id,
    choice_id = EXCLUDED.choice_id,
    text_answer = EXCLUDED.text_answer,
    file_name = EXCLUDED.file_name,
    file_type = EXCLUDED.file_type,
    file_size = EXCLUDED.file_size,
    file_url = EXCLUDED.file_url,
    is_correct = EXCLUDED.is_correct;

COMMIT;

-- ---------------------------------------------------------------------------
-- Test accounts
-- ---------------------------------------------------------------------------
-- admin@sagelms.dev              / Admin123!
-- instructor@sagelms.dev         / Instructor123!
-- frontend.instructor@sagelms.dev / Instructor123!
-- data.instructor@sagelms.dev    / Instructor123!
-- devops.instructor@sagelms.dev  / Instructor123!
-- product.instructor@sagelms.dev / Instructor123!
-- pending.instructor@sagelms.dev / Instructor123!  -- cannot login until approved
-- rejected.instructor@sagelms.dev / Instructor123! -- rejected account
-- student@sagelms.dev            / Student123!
-- student2@sagelms.dev           / Student123!
-- student3@sagelms.dev           / Student123!
-- student4@sagelms.dev           / Student123!
