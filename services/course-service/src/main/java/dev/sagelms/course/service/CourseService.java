package dev.sagelms.course.service;

import dev.sagelms.course.dto.CourseRequest;
import dev.sagelms.course.dto.CourseResponse;
import dev.sagelms.course.entity.Course;
import dev.sagelms.course.entity.CourseStatus;
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

    public CourseService(CourseRepository courseRepository, EnrollmentRepository enrollmentRepository) {
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
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
        course.setInstructorId(instructorId);

        Course saved = courseRepository.save(course);
        return CourseResponse.fromEntity(saved, 0);
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

        Course updated = courseRepository.save(course);
        long enrollmentCount = courseRepository.countEnrollments(courseId);
        return CourseResponse.fromEntity(updated, enrollmentCount);
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
        return CourseResponse.fromEntity(course, enrollmentCount);
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

        return courses.map(course ->
            CourseResponse.fromEntity(course, enrollmentCounts.getOrDefault(course.getId(), 0L))
        );
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> getCoursesForViewer(String roles, Pageable pageable) {
        if (RoleUtils.isAdmin(roles) || RoleUtils.isInstructorOrAdmin(roles)) {
            return getAllCourses(pageable);
        }
        return getPublishedCourses(pageable);
    }

    @Transactional(readOnly = true)
    public CourseResponse getCourseById(UUID courseId, UUID userId, String roles) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Course not found: " + courseId));

        boolean canView = course.getStatus() == CourseStatus.PUBLISHED
                || RoleUtils.isAdmin(roles)
                || (RoleUtils.isInstructorOrAdmin(roles) && userId != null && course.getInstructorId().equals(userId));

        if (!canView) {
            throw new CourseForbiddenException("Course is not published.");
        }

        long enrollmentCount = courseRepository.countEnrollments(courseId);
        return CourseResponse.fromEntity(course, enrollmentCount);
    }

    /**
     * Get published courses
     */
    @Transactional(readOnly = true)
    public Page<CourseResponse> getPublishedCourses(Pageable pageable) {
        Page<Course> courses = courseRepository.findPublishedCourses(pageable);
        List<UUID> courseIds = courses.getContent().stream().map(Course::getId).toList();

        Map<UUID, Long> enrollmentCounts = enrollmentRepository.countEnrollmentsByCourseIdsMap(courseIds);

        return courses.map(course ->
            CourseResponse.fromEntity(course, enrollmentCounts.getOrDefault(course.getId(), 0L))
        );
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
            return courses.map(course ->
                CourseResponse.fromEntity(course, enrollmentCounts.getOrDefault(course.getId(), 0L))
            );
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + status + ". Must be DRAFT, PUBLISHED, or ARCHIVED");
        }
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> getCoursesByStatusForViewer(String status, String roles, Pageable pageable) {
        CourseStatus courseStatus;
        try {
            courseStatus = CourseStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + status + ". Must be DRAFT, PUBLISHED, or ARCHIVED");
        }

        if (!RoleUtils.isInstructorOrAdmin(roles) && courseStatus != CourseStatus.PUBLISHED) {
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

        return courses.stream()
                .map(course -> CourseResponse.fromEntity(course, enrollmentCounts.getOrDefault(course.getId(), 0L)))
                .toList();
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

        return courses.map(course ->
            CourseResponse.fromEntity(course, enrollmentCounts.getOrDefault(course.getId(), 0L))
        );
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> searchCoursesForViewer(String search, String roles, Pageable pageable) {
        if (RoleUtils.isAdmin(roles) || RoleUtils.isInstructorOrAdmin(roles)) {
            return searchCourses(search, pageable);
        }

        Page<Course> courses = courseRepository.searchPublishedByTitle(search, pageable);
        List<UUID> courseIds = courses.getContent().stream().map(Course::getId).toList();
        Map<UUID, Long> enrollmentCounts = enrollmentRepository.countEnrollmentsByCourseIdsMap(courseIds);

        return courses.map(course ->
                CourseResponse.fromEntity(course, enrollmentCounts.getOrDefault(course.getId(), 0L))
        );
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> getCoursesByCategory(String category, String roles, Pageable pageable) {
        CourseStatus status = (RoleUtils.isAdmin(roles) || RoleUtils.isInstructorOrAdmin(roles))
                ? null
                : CourseStatus.PUBLISHED;
        Page<Course> courses = status == null
                ? courseRepository.findByCategory(category, pageable)
                : courseRepository.findByStatusAndCategoryIgnoreCase(status, category, pageable);
        List<UUID> courseIds = courses.getContent().stream().map(Course::getId).toList();

        Map<UUID, Long> enrollmentCounts = enrollmentRepository.countEnrollmentsByCourseIdsMap(courseIds);

        return courses.map(course ->
                CourseResponse.fromEntity(course, enrollmentCounts.getOrDefault(course.getId(), 0L))
        );
    }

    /**
     * Get courses by category
     */
    @Transactional(readOnly = true)
    public List<CourseResponse> getCoursesByCategory(String category) {
        List<Course> courses = courseRepository.findByCategory(category);
        List<UUID> courseIds = courses.stream().map(Course::getId).toList();

        Map<UUID, Long> enrollmentCounts = enrollmentRepository.countEnrollmentsByCourseIdsMap(courseIds);

        return courses.stream()
                .map(course -> CourseResponse.fromEntity(course, enrollmentCounts.getOrDefault(course.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> getCoursesByCategoryForViewer(String category, String roles) {
        List<Course> courses = RoleUtils.isInstructorOrAdmin(roles)
                ? courseRepository.findByCategory(category)
                : courseRepository.findByStatusAndCategoryIgnoreCase(CourseStatus.PUBLISHED, category);
        List<UUID> courseIds = courses.stream().map(Course::getId).toList();

        Map<UUID, Long> enrollmentCounts = enrollmentRepository.countEnrollmentsByCourseIdsMap(courseIds);

        return courses.stream()
                .map(course -> CourseResponse.fromEntity(course, enrollmentCounts.getOrDefault(course.getId(), 0L)))
                .toList();
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

    public record CourseAccessResult(boolean accessible) {}

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
