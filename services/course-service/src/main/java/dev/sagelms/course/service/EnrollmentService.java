package dev.sagelms.course.service;

import dev.sagelms.course.dto.EnrollmentResponse;
import dev.sagelms.course.entity.Course;
import dev.sagelms.course.entity.Enrollment;
import dev.sagelms.course.entity.EnrollmentStatus;
import dev.sagelms.course.repository.CourseRepository;
import dev.sagelms.course.repository.EnrollmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service layer for Enrollment operations
 */
@Service
@Transactional
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;

    public EnrollmentService(EnrollmentRepository enrollmentRepository, CourseRepository courseRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.courseRepository = courseRepository;
    }

    /**
     * Enroll a student in a course
     */
    public EnrollmentResponse enrollStudent(UUID courseId, UUID studentId) {
        // Check if course exists
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Course not found: " + courseId));

        // Check if already enrolled
        if (enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)) {
            throw new AlreadyEnrolledException("Student already enrolled in this course");
        }

        // Create enrollment
        Enrollment enrollment = new Enrollment();
        enrollment.setCourseId(courseId);
        enrollment.setStudentId(studentId);
        enrollment.setStatus(EnrollmentStatus.ACTIVE);

        Enrollment saved = enrollmentRepository.save(enrollment);
        return EnrollmentResponse.fromEntity(saved, course.getTitle(), null);
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

    /**
     * Get enrollments for a course (for instructor)
     */
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getEnrollmentsByCourse(UUID courseId) {
        return enrollmentRepository.findByCourseId(courseId).stream()
                .map(EnrollmentResponse::fromEntity)
                .toList();
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
     * Check if student is enrolled in course
     */
    @Transactional(readOnly = true)
    public boolean isEnrolled(UUID studentId, UUID courseId) {
        return enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId);
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
}
