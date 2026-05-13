package dev.sagelms.course.service;

import dev.sagelms.course.dto.CourseRequest;
import dev.sagelms.course.dto.CourseResponse;
import dev.sagelms.course.entity.Course;
import dev.sagelms.course.entity.CourseStatus;
import dev.sagelms.course.entity.EnrollmentPolicy;
import dev.sagelms.course.repository.CourseRepository;
import dev.sagelms.course.repository.EnrollmentRepository;
import dev.sagelms.course.security.RoleUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service layer for Course operations
 */
@Service
@Transactional
public class CourseService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AuthUserClient authUserClient;

    public CourseService(
            CourseRepository courseRepository,
            EnrollmentRepository enrollmentRepository,
            AuthUserClient authUserClient) {
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.authUserClient = authUserClient;
    }

    /**
     * Create a new course
     */
    public CourseResponse createCourse(CourseRequest request, UUID instructorId, String roles) {
        if (!RoleUtils.isInstructorOrAdmin(roles)) {
            throw new CourseForbiddenException("Instructor or admin role required.");
        }
        Course course = new Course();
        course.setTitle(request.title());
        course.setDescription(request.description());
        course.setThumbnailUrl(request.thumbnailUrl());
        course.setStatus(request.status() != null ? request.status() : CourseStatus.DRAFT);
        course.setCategory(request.category());
        course.setEnrollmentPolicy(request.enrollmentPolicy() != null ? request.enrollmentPolicy() : EnrollmentPolicy.OPEN);
        course.setInstructorId(instructorId);

        Course saved = courseRepository.save(course);
        return enrichCourseResponse(saved, 0);
    }

    /**
     * Update an existing course
     */
    public CourseResponse updateCourse(UUID courseId, CourseRequest request, UUID userId, String roles) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Course not found: " + courseId));

        if (!RoleUtils.isAdmin(roles) && !course.getInstructorId().equals(userId)) {
            throw new CourseOwnershipException("You do not own this course");
        }

        course.setTitle(request.title());
        course.setDescription(request.description());
        course.setThumbnailUrl(request.thumbnailUrl());
        course.setStatus(request.status());
        course.setCategory(request.category());
        course.setEnrollmentPolicy(request.enrollmentPolicy() != null ? request.enrollmentPolicy() : EnrollmentPolicy.OPEN);

        Course updated = courseRepository.save(course);
        long enrollmentCount = courseRepository.countEnrollments(courseId);
        return enrichCourseResponse(updated, enrollmentCount);
    }

    /**
     * Delete a course
     */
    public void deleteCourse(UUID courseId, UUID userId, String roles) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Course not found: " + courseId));

        if (!RoleUtils.isAdmin(roles) && !course.getInstructorId().equals(userId)) {
            throw new CourseOwnershipException("You do not own this course");
        }

        courseRepository.delete(course);
    }

    @Transactional(readOnly = true)
    public boolean isCourseOwner(UUID courseId, UUID userId) {
        return courseRepository.findById(courseId)
                .map(course -> course.getInstructorId().equals(userId))
                .orElse(false);
    }

    /**
     * Get course by ID
     */
    @Transactional(readOnly = true)
    public CourseResponse getCourseById(UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Course not found: " + courseId));

        long enrollmentCount = courseRepository.countEnrollments(courseId);
        return enrichCourseResponse(course, enrollmentCount);
    }

    /**
     * Get all courses with pagination
     * OPTIMIZED: Use bulk fetch to avoid N+1 problem
     */
    @Transactional(readOnly = true)
    public Page<CourseResponse> getAllCourses(Pageable pageable) {
        Page<Course> courses = courseRepository.findAll(pageable);
        List<UUID> courseIds = courses.getContent().stream().map(Course::getId).toList();

        // Bulk fetch enrollment counts (1 query instead of N)
        Map<UUID, Long> enrollmentCounts = enrollmentRepository.countEnrollmentsByCourseIdsMap(courseIds);

        return mapCoursesWithInstructors(courses, enrollmentCounts);
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> getCoursesForViewer(UUID userId, String roles, Pageable pageable) {
        return getCoursesForViewer(userId, roles, "teaching", pageable);
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> getCoursesForViewer(UUID userId, String roles, String scope, Pageable pageable) {
        if (RoleUtils.isAdmin(roles)) {
            return getAllCourses(pageable);
        }
        if (RoleUtils.hasRole(roles, "INSTRUCTOR")) {
            if (userId == null) {
                throw new CourseForbiddenException("Instructor identity required.");
            }
            if (isExploreScope(scope)) {
                return getPublishedCoursesNotOwnedBy(userId, pageable);
            }
            return getCoursesByInstructor(userId, pageable);
        }
        return getPublishedCourses(pageable);
    }

    @Transactional(readOnly = true)
    public CourseResponse getCourseById(UUID courseId, UUID userId, String roles) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Course not found: " + courseId));

        boolean canView = RoleUtils.isAdmin(roles)
                || (RoleUtils.hasRole(roles, "INSTRUCTOR") && userId != null && course.getInstructorId().equals(userId))
                || course.getStatus() == CourseStatus.PUBLISHED;

        if (!canView) {
            throw new CourseForbiddenException("Course is not published.");
        }

        long enrollmentCount = courseRepository.countEnrollments(courseId);
        return enrichCourseResponse(course, enrollmentCount);
    }

    /**
     * Get published courses
     */
    @Transactional(readOnly = true)
    public Page<CourseResponse> getPublishedCourses(Pageable pageable) {
        Page<Course> courses = courseRepository.findPublishedCourses(pageable);
        List<UUID> courseIds = courses.getContent().stream().map(Course::getId).toList();

        Map<UUID, Long> enrollmentCounts = enrollmentRepository.countEnrollmentsByCourseIdsMap(courseIds);

        return mapCoursesWithInstructors(courses, enrollmentCounts);
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> getPublishedCoursesNotOwnedBy(UUID instructorId, Pageable pageable) {
        Page<Course> courses = courseRepository.findPublishedCoursesNotOwnedBy(instructorId, pageable);
        List<UUID> courseIds = courses.getContent().stream().map(Course::getId).toList();

        Map<UUID, Long> enrollmentCounts = enrollmentRepository.countEnrollmentsByCourseIdsMap(courseIds);

        return mapCoursesWithInstructors(courses, enrollmentCounts);
    }

    /**
     * Get courses by status (DRAFT, PUBLISHED, ARCHIVED)
     */
    @Transactional(readOnly = true)
    public Page<CourseResponse> getCoursesByStatus(String status, Pageable pageable) {
        try {
            CourseStatus courseStatus = CourseStatus.valueOf(status.toUpperCase());
            Page<Course> courses = courseRepository.findByStatus(courseStatus, pageable);
            List<UUID> courseIds = courses.getContent().stream().map(Course::getId).toList();
            Map<UUID, Long> enrollmentCounts = enrollmentRepository.countEnrollmentsByCourseIdsMap(courseIds);
            return mapCoursesWithInstructors(courses, enrollmentCounts);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + status + ". Must be DRAFT, PUBLISHED, or ARCHIVED");
        }
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> getCoursesByStatusForViewer(String status, UUID userId, String roles, Pageable pageable) {
        return getCoursesByStatusForViewer(status, userId, roles, "teaching", pageable);
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> getCoursesByStatusForViewer(String status, UUID userId, String roles, String scope, Pageable pageable) {
        CourseStatus courseStatus;
        try {
            courseStatus = CourseStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + status + ". Must be DRAFT, PUBLISHED, or ARCHIVED");
        }

        if (RoleUtils.isAdmin(roles)) {
            return getCoursesByStatus(status, pageable);
        }

        if (RoleUtils.hasRole(roles, "INSTRUCTOR")) {
            if (userId == null) {
                throw new CourseForbiddenException("Instructor identity required.");
            }
            if (isExploreScope(scope)) {
                if (courseStatus != CourseStatus.PUBLISHED) {
                    throw new CourseForbiddenException("Only published courses can be explored.");
                }
                return getPublishedCoursesNotOwnedBy(userId, pageable);
            }
            return getCoursesByInstructorAndStatus(userId, courseStatus, pageable);
        }

        if (courseStatus != CourseStatus.PUBLISHED) {
            throw new CourseForbiddenException("Instructor or admin role required for non-published courses.");
        }

        return getCoursesByStatus(status, pageable);
    }

    /**
     * Get courses by instructor
     */
    @Transactional(readOnly = true)
    public List<CourseResponse> getCoursesByInstructor(UUID instructorId) {
        List<Course> courses = courseRepository.findByInstructorId(instructorId);
        List<UUID> courseIds = courses.stream().map(Course::getId).toList();

        Map<UUID, Long> enrollmentCounts = enrollmentRepository.countEnrollmentsByCourseIdsMap(courseIds);

        return mapCoursesWithInstructors(courses, enrollmentCounts);
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> getCoursesByInstructor(UUID instructorId, Pageable pageable) {
        Page<Course> courses = courseRepository.findByInstructorId(instructorId, pageable);
        List<UUID> courseIds = courses.getContent().stream().map(Course::getId).toList();
        Map<UUID, Long> enrollmentCounts = enrollmentRepository.countEnrollmentsByCourseIdsMap(courseIds);

        return mapCoursesWithInstructors(courses, enrollmentCounts);
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> getCoursesByInstructorAndStatus(UUID instructorId, CourseStatus status, Pageable pageable) {
        Page<Course> courses = courseRepository.findByInstructorIdAndStatus(instructorId, status, pageable);
        List<UUID> courseIds = courses.getContent().stream().map(Course::getId).toList();
        Map<UUID, Long> enrollmentCounts = enrollmentRepository.countEnrollmentsByCourseIdsMap(courseIds);

        return mapCoursesWithInstructors(courses, enrollmentCounts);
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> getCoursesByInstructor(UUID instructorId, String roles) {
        if (!RoleUtils.isInstructorOrAdmin(roles)) {
            throw new CourseForbiddenException("Instructor or admin role required.");
        }
        return getCoursesByInstructor(instructorId);
    }

    /**
     * Search courses by title
     */
    @Transactional(readOnly = true)
    public Page<CourseResponse> searchCourses(String search, Pageable pageable) {
        Page<Course> courses = courseRepository.searchByTitle(search, pageable);
        List<UUID> courseIds = courses.getContent().stream().map(Course::getId).toList();

        Map<UUID, Long> enrollmentCounts = enrollmentRepository.countEnrollmentsByCourseIdsMap(courseIds);

        return mapCoursesWithInstructors(courses, enrollmentCounts);
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> searchCoursesForViewer(String search, UUID userId, String roles, Pageable pageable) {
        return searchCoursesForViewer(search, userId, roles, "teaching", pageable);
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> searchCoursesForViewer(String search, UUID userId, String roles, String scope, Pageable pageable) {
        if (RoleUtils.isAdmin(roles)) {
            return searchCourses(search, pageable);
        }
        if (RoleUtils.hasRole(roles, "INSTRUCTOR")) {
            if (userId == null) {
                throw new CourseForbiddenException("Instructor identity required.");
            }
            Page<Course> courses = isExploreScope(scope)
                    ? courseRepository.searchPublishedNotOwnedByTitle(userId, search, pageable)
                    : courseRepository.searchByInstructorAndTitle(userId, search, pageable);
            List<UUID> courseIds = courses.getContent().stream().map(Course::getId).toList();
            Map<UUID, Long> enrollmentCounts = enrollmentRepository.countEnrollmentsByCourseIdsMap(courseIds);
            return mapCoursesWithInstructors(courses, enrollmentCounts);
        }

        Page<Course> courses = courseRepository.searchPublishedByTitle(search, pageable);
        List<UUID> courseIds = courses.getContent().stream().map(Course::getId).toList();
        Map<UUID, Long> enrollmentCounts = enrollmentRepository.countEnrollmentsByCourseIdsMap(courseIds);

        return mapCoursesWithInstructors(courses, enrollmentCounts);
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> getCoursesByCategory(String category, UUID userId, String roles, Pageable pageable) {
        return getCoursesByCategory(category, userId, roles, "teaching", pageable);
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> getCoursesByCategory(String category, UUID userId, String roles, String scope, Pageable pageable) {
        Page<Course> courses;
        if (RoleUtils.isAdmin(roles)) {
            courses = courseRepository.findByCategory(category, pageable);
        } else if (RoleUtils.hasRole(roles, "INSTRUCTOR")) {
            if (userId == null) {
                throw new CourseForbiddenException("Instructor identity required.");
            }
            courses = isExploreScope(scope)
                    ? courseRepository.findByStatusAndInstructorIdNotAndCategoryIgnoreCase(
                            CourseStatus.PUBLISHED, userId, category, pageable)
                    : courseRepository.findByInstructorIdAndCategory(userId, category, pageable);
        } else {
            courses = courseRepository.findByStatusAndCategoryIgnoreCase(CourseStatus.PUBLISHED, category, pageable);
        }
        List<UUID> courseIds = courses.getContent().stream().map(Course::getId).toList();

        Map<UUID, Long> enrollmentCounts = enrollmentRepository.countEnrollmentsByCourseIdsMap(courseIds);

        return mapCoursesWithInstructors(courses, enrollmentCounts);
    }

    /**
     * Get courses by category
     */
    @Transactional(readOnly = true)
    public List<CourseResponse> getCoursesByCategory(String category) {
        List<Course> courses = courseRepository.findByCategory(category);
        List<UUID> courseIds = courses.stream().map(Course::getId).toList();

        Map<UUID, Long> enrollmentCounts = enrollmentRepository.countEnrollmentsByCourseIdsMap(courseIds);

        return mapCoursesWithInstructors(courses, enrollmentCounts);
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> getCoursesByCategoryForViewer(String category, UUID userId, String roles) {
        List<Course> courses;
        if (RoleUtils.isAdmin(roles)) {
            courses = courseRepository.findByCategory(category);
        } else if (RoleUtils.hasRole(roles, "INSTRUCTOR")) {
            if (userId == null) {
                throw new CourseForbiddenException("Instructor identity required.");
            }
            courses = courseRepository.findByInstructorIdAndCategory(userId, category);
        } else {
            courses = courseRepository.findByStatusAndCategoryIgnoreCase(CourseStatus.PUBLISHED, category);
        }
        List<UUID> courseIds = courses.stream().map(Course::getId).toList();

        Map<UUID, Long> enrollmentCounts = enrollmentRepository.countEnrollmentsByCourseIdsMap(courseIds);

        return mapCoursesWithInstructors(courses, enrollmentCounts);
    }

    @Transactional(readOnly = true)
    public CourseAccessResult canAccessCourseContent(UUID courseId, UUID userId, String roles) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Course not found: " + courseId));
        if (RoleUtils.isAdmin(roles)
                || (RoleUtils.isInstructorOrAdmin(roles) && userId != null && course.getInstructorId().equals(userId))) {
            return new CourseAccessResult(true);
        }
        boolean enrolled = userId != null && enrollmentRepository.existsByStudentIdAndCourseIdAndStatus(
                userId, courseId, dev.sagelms.course.entity.EnrollmentStatus.ACTIVE);
        return new CourseAccessResult(course.getStatus() == CourseStatus.PUBLISHED && enrolled);
    }

    private CourseResponse enrichCourseResponse(Course course, long enrollmentCount) {
        Map<UUID, AuthUserClient.UserSummary> instructors = authUserClient.getUsersByIds(List.of(course.getInstructorId()));
        AuthUserClient.UserSummary instructor = instructors != null ? instructors.get(course.getInstructorId()) : null;
        return buildCourseResponse(course, enrollmentCount, instructor);
    }

    private Page<CourseResponse> mapCoursesWithInstructors(Page<Course> courses, Map<UUID, Long> enrollmentCounts) {
        Map<UUID, AuthUserClient.UserSummary> instructorsById = getInstructorsById(courses.getContent());
        return courses.map(course -> buildCourseResponse(
                course,
                enrollmentCounts.getOrDefault(course.getId(), 0L),
                instructorsById.get(course.getInstructorId())));
    }

    private List<CourseResponse> mapCoursesWithInstructors(List<Course> courses, Map<UUID, Long> enrollmentCounts) {
        Map<UUID, AuthUserClient.UserSummary> instructorsById = getInstructorsById(courses);
        return courses.stream()
                .map(course -> buildCourseResponse(
                        course,
                        enrollmentCounts.getOrDefault(course.getId(), 0L),
                        instructorsById.get(course.getInstructorId())))
                .toList();
    }

    private Map<UUID, AuthUserClient.UserSummary> getInstructorsById(List<Course> courses) {
        Map<UUID, AuthUserClient.UserSummary> instructorsById = authUserClient.getUsersByIds(
                courses.stream().map(Course::getInstructorId).distinct().toList());
        return instructorsById != null ? instructorsById : Map.of();
    }

    private CourseResponse buildCourseResponse(
            Course course,
            long enrollmentCount,
            AuthUserClient.UserSummary instructor) {
        return CourseResponse.fromEntity(
                course,
                enrollmentCount,
                instructor != null ? instructor.email() : null,
                instructor != null ? instructor.fullName() : null,
                instructor != null ? instructor.avatarUrl() : null,
                instructor != null ? instructor.instructorHeadline() : null,
                instructor != null ? instructor.instructorBio() : null,
                instructor != null ? instructor.instructorExpertise() : null,
                instructor != null ? instructor.instructorWebsite() : null,
                instructor != null ? instructor.instructorYearsExperience() : null);
    }

    public record CourseAccessResult(boolean accessible) {}

    private boolean isExploreScope(String scope) {
        return "explore".equalsIgnoreCase(scope);
    }

    // ============== Exception Classes ==============

    public static class CourseNotFoundException extends RuntimeException {
        public CourseNotFoundException(String message) {
            super(message);
        }
    }

    public static class CourseOwnershipException extends RuntimeException {
        public CourseOwnershipException(String message) {
            super(message);
        }
    }

    public static class CourseForbiddenException extends RuntimeException {
        public CourseForbiddenException(String message) {
            super(message);
        }
    }
}
