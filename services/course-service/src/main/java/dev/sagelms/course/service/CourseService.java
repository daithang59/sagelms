package dev.sagelms.course.service;

import dev.sagelms.course.dto.CourseRequest;
import dev.sagelms.course.dto.CourseResponse;
import dev.sagelms.course.entity.Course;
import dev.sagelms.course.entity.CourseStatus;
import dev.sagelms.course.repository.CourseRepository;
import dev.sagelms.course.repository.EnrollmentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

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
    public CourseResponse createCourse(CourseRequest request, UUID instructorId) {
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
    public CourseResponse updateCourse(UUID courseId, CourseRequest request, UUID instructorId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Course not found: " + courseId));

        // Check ownership
        if (!course.getInstructorId().equals(instructorId)) {
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
    public void deleteCourse(UUID courseId, UUID instructorId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Course not found: " + courseId));

        // Check ownership
        if (!course.getInstructorId().equals(instructorId)) {
            throw new CourseOwnershipException("You do not own this course");
        }

        courseRepository.delete(course);
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
}
