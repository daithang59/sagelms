package dev.sagelms.course.service;

import dev.sagelms.course.dto.EnrollmentResponse;
import dev.sagelms.course.entity.Course;
import dev.sagelms.course.entity.Enrollment;
import dev.sagelms.course.entity.EnrollmentStatus;
import dev.sagelms.course.repository.CourseRepository;
import dev.sagelms.course.repository.EnrollmentRepository;
import dev.sagelms.course.security.RoleUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service layer for Enrollment operations
 */
@Service
@Transactional
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final AuthUserClient authUserClient;

    public EnrollmentService(
            EnrollmentRepository enrollmentRepository,
            CourseRepository courseRepository,
            AuthUserClient authUserClient) {
        this.enrollmentRepository = enrollmentRepository;
        this.courseRepository = courseRepository;
        this.authUserClient = authUserClient;
    }

    /**
     * Enroll a student in a course
     */
    public EnrollmentResponse enrollStudent(UUID courseId, UUID studentId) {
        // Check if course exists
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Course not found: " + courseId));

        // Check if already actively enrolled
        if (enrollmentRepository.existsByStudentIdAndCourseIdAndStatus(studentId, courseId, EnrollmentStatus.ACTIVE)) {
            throw new AlreadyEnrolledException("Student already enrolled in this course");
        }

        // Check if there's a dropped enrollment - reactivate it instead of creating new
        var existingEnrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId);
        if (existingEnrollment.isPresent()) {
            Enrollment enrollment = existingEnrollment.get();
            if (enrollment.getStatus() == EnrollmentStatus.DROPPED) {
                enrollment.setStatus(EnrollmentStatus.ACTIVE);
                Enrollment saved = enrollmentRepository.save(enrollment);
                return EnrollmentResponse.fromEntity(saved, course.getTitle(), null);
            }
        }

        // Create new enrollment
        Enrollment enrollment = new Enrollment();
        enrollment.setCourseId(courseId);
        enrollment.setStudentId(studentId);
        enrollment.setStatus(EnrollmentStatus.ACTIVE);

        Enrollment saved = enrollmentRepository.save(enrollment);
        return EnrollmentResponse.fromEntity(saved, course.getTitle(), null);
    }

    public EnrollmentResponse enrollStudent(UUID courseId, UUID studentId, String roles) {
        requireStudent(roles);
        return enrollStudent(courseId, studentId);
    }

    /**
     * Unenroll a student from a course
     */
    public void unenrollStudent(UUID courseId, UUID studentId) {
        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new EnrollmentNotFoundException("Enrollment not found"));

        enrollment.setStatus(EnrollmentStatus.DROPPED);
        enrollmentRepository.save(enrollment);
    }

    public void unenrollStudent(UUID courseId, UUID studentId, String roles) {
        requireStudent(roles);
        unenrollStudent(courseId, studentId);
    }

    /**
     * Get enrollments for a course (for instructor)
     */
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getEnrollmentsByCourse(UUID courseId) {
        return enrollmentRepository.findByCourseId(courseId).stream()
                .map(EnrollmentResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getEnrollmentsByCourse(UUID courseId, UUID userId, String roles) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Course not found: " + courseId));
        if (!RoleUtils.isAdmin(roles) && !course.getInstructorId().equals(userId)) {
            throw new CourseForbiddenException("Course owner or admin role required.");
        }
        return buildCourseEnrollmentResponses(course, enrollmentRepository.findByCourseId(courseId));
    }

    /**
     * Get enrollments for a student
     */
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getEnrollmentsByStudent(UUID studentId) {
        return enrollmentRepository.findByStudentId(studentId).stream()
                .map(EnrollmentResponse::fromEntity)
                .toList();
    }

    /**
     * Get active enrollments for a student
     */
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getActiveEnrollmentsByStudent(UUID studentId) {
        return enrollmentRepository.findActiveEnrollmentsByStudentId(studentId).stream()
                .map(EnrollmentResponse::fromEntity)
                .toList();
    }

    /**
     * Check if student is actively enrolled in course
     */
    @Transactional(readOnly = true)
    public boolean isEnrolled(UUID studentId, UUID courseId) {
        return enrollmentRepository.existsByStudentIdAndCourseIdAndStatus(studentId, courseId, EnrollmentStatus.ACTIVE);
    }

    /**
     * Complete a course (mark enrollment as completed)
     */
    public EnrollmentResponse completeCourse(UUID courseId, UUID studentId) {
        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new EnrollmentNotFoundException("Enrollment not found"));

        enrollment.setStatus(EnrollmentStatus.COMPLETED);
        Enrollment saved = enrollmentRepository.save(enrollment);

        Course course = courseRepository.findById(courseId).orElse(null);
        return EnrollmentResponse.fromEntity(saved, course != null ? course.getTitle() : null, null);
    }

    public EnrollmentResponse completeCourse(UUID courseId, UUID studentId, String roles) {
        requireStudent(roles);
        return completeCourse(courseId, studentId);
    }

    private void requireStudent(String roles) {
        if (!RoleUtils.isStudent(roles)) {
            throw new CourseForbiddenException("Student role required.");
        }
    }

    private List<EnrollmentResponse> buildCourseEnrollmentResponses(Course course, List<Enrollment> enrollments) {
        Map<UUID, AuthUserClient.UserSummary> fetchedUsersById = authUserClient.getUsersByIds(
                enrollments.stream().map(Enrollment::getStudentId).toList());
        Map<UUID, AuthUserClient.UserSummary> usersById = fetchedUsersById != null ? fetchedUsersById : Map.of();

        return enrollments.stream()
                .map(enrollment -> {
                    AuthUserClient.UserSummary student = usersById.get(enrollment.getStudentId());
                    return EnrollmentResponse.fromEntity(
                            enrollment,
                            course.getTitle(),
                            student != null ? student.email() : null,
                            student != null ? student.fullName() : null,
                            student != null ? student.avatarUrl() : null);
                })
                .toList();
    }

    // ============== Exception Classes ==============

    public static class CourseNotFoundException extends RuntimeException {
        public CourseNotFoundException(String message) {
            super(message);
        }
    }

    public static class EnrollmentNotFoundException extends RuntimeException {
        public EnrollmentNotFoundException(String message) {
            super(message);
        }
    }

    public static class AlreadyEnrolledException extends RuntimeException {
        public AlreadyEnrolledException(String message) {
            super(message);
        }
    }

    public static class CourseForbiddenException extends RuntimeException {
        public CourseForbiddenException(String message) {
            super(message);
        }
    }
}
