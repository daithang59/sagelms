package dev.sagelms.course.service;

import dev.sagelms.course.dto.EnrollmentResponse;
import dev.sagelms.course.entity.Course;
import dev.sagelms.course.entity.Enrollment;
import dev.sagelms.course.entity.EnrollmentPolicy;
import dev.sagelms.course.entity.EnrollmentStatus;
import dev.sagelms.course.repository.CourseRepository;
import dev.sagelms.course.repository.EnrollmentRepository;
import dev.sagelms.course.security.RoleUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
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

        EnrollmentStatus targetStatus = course.getEnrollmentPolicy() == EnrollmentPolicy.APPROVAL_REQUIRED
                ? EnrollmentStatus.PENDING
                : EnrollmentStatus.ACTIVE;

        // Check if already enrolled or waiting for approval
        if (enrollmentRepository.existsByStudentIdAndCourseIdAndStatus(studentId, courseId, EnrollmentStatus.ACTIVE)) {
            throw new AlreadyEnrolledException("Student already enrolled in this course");
        }
        if (enrollmentRepository.existsByStudentIdAndCourseIdAndStatus(studentId, courseId, EnrollmentStatus.PENDING)) {
            throw new AlreadyEnrolledException("Enrollment request is waiting for instructor approval");
        }

        // Reuse an old dropped/rejected enrollment instead of creating a duplicate row.
        var existingEnrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId);
        if (existingEnrollment.isPresent()) {
            Enrollment enrollment = existingEnrollment.get();
            if (enrollment.getStatus() == EnrollmentStatus.DROPPED || enrollment.getStatus() == EnrollmentStatus.REJECTED) {
                enrollment.setStatus(targetStatus);
                clearReview(enrollment);
                Enrollment saved = enrollmentRepository.save(enrollment);
                return EnrollmentResponse.fromEntity(saved, course.getTitle(), null);
            }
            throw new AlreadyEnrolledException("Student already has an enrollment for this course");
        }

        // Create new enrollment
        Enrollment enrollment = new Enrollment();
        enrollment.setCourseId(courseId);
        enrollment.setStudentId(studentId);
        enrollment.setStatus(targetStatus);
        clearReview(enrollment);

        Enrollment saved = enrollmentRepository.save(enrollment);
        return EnrollmentResponse.fromEntity(saved, course.getTitle(), null);
    }

    public EnrollmentResponse enrollStudent(UUID courseId, UUID studentId, String roles) {
        requireLearner(roles);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Course not found: " + courseId));
        if (RoleUtils.hasRole(roles, "INSTRUCTOR") && course.getInstructorId().equals(studentId)) {
            throw new CourseForbiddenException("Instructor cannot enroll in their own course.");
        }
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
        requireLearner(roles);
        unenrollStudent(courseId, studentId);
    }

    public EnrollmentResponse approveParticipant(UUID courseId, UUID participantId, UUID actorUserId, String roles) {
        Course course = requireManageableCourse(courseId, actorUserId, roles);
        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(participantId, courseId)
                .orElseThrow(() -> new EnrollmentNotFoundException("Enrollment not found"));
        if (enrollment.getStatus() != EnrollmentStatus.PENDING) {
            throw new IllegalArgumentException("Only pending enrollment requests can be approved.");
        }
        enrollment.setStatus(EnrollmentStatus.ACTIVE);
        setReview(enrollment, actorUserId, null);
        Enrollment saved = enrollmentRepository.save(enrollment);
        return EnrollmentResponse.fromEntity(saved, course.getTitle(), null);
    }

    public EnrollmentResponse rejectParticipant(
            UUID courseId,
            UUID participantId,
            UUID actorUserId,
            String roles,
            String reason) {
        Course course = requireManageableCourse(courseId, actorUserId, roles);
        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(participantId, courseId)
                .orElseThrow(() -> new EnrollmentNotFoundException("Enrollment not found"));
        if (enrollment.getStatus() != EnrollmentStatus.PENDING) {
            throw new IllegalArgumentException("Only pending enrollment requests can be rejected.");
        }
        enrollment.setStatus(EnrollmentStatus.REJECTED);
        setReview(enrollment, actorUserId, reason);
        Enrollment saved = enrollmentRepository.save(enrollment);
        return EnrollmentResponse.fromEntity(saved, course.getTitle(), null);
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

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getVisibleEnrollmentsByStudent(UUID studentId) {
        return enrollmentRepository.findVisibleEnrollmentsByStudentId(studentId).stream()
                .map(enrollment -> {
                    Course course = courseRepository.findById(enrollment.getCourseId()).orElse(null);
                    return EnrollmentResponse.fromEntity(
                            enrollment,
                            course != null ? course.getTitle() : null,
                            null);
                })
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
        if (enrollment.getStatus() != EnrollmentStatus.ACTIVE) {
            throw new CourseForbiddenException("Only active enrollments can be completed.");
        }

        enrollment.setStatus(EnrollmentStatus.COMPLETED);
        Enrollment saved = enrollmentRepository.save(enrollment);

        Course course = courseRepository.findById(courseId).orElse(null);
        return EnrollmentResponse.fromEntity(saved, course != null ? course.getTitle() : null, null);
    }

    public EnrollmentResponse completeCourse(UUID courseId, UUID studentId, String roles) {
        requireLearner(roles);
        return completeCourse(courseId, studentId);
    }

    public void dropParticipant(UUID courseId, UUID participantId, UUID actorUserId, String roles, String reason) {
        Course course = requireManageableCourse(courseId, actorUserId, roles);
        if (participantId.equals(course.getInstructorId())) {
            throw new CourseForbiddenException("Course owner cannot be removed from their own course.");
        }

        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(participantId, courseId)
                .orElseThrow(() -> new EnrollmentNotFoundException("Enrollment not found"));
        enrollment.setStatus(EnrollmentStatus.DROPPED);
        setReview(enrollment, actorUserId, reason);
        enrollmentRepository.save(enrollment);
    }

    @Transactional(readOnly = true)
    public EnrollmentStatus getEnrollmentStatus(UUID studentId, UUID courseId) {
        return enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .map(Enrollment::getStatus)
                .orElse(null);
    }

    private void requireLearner(String roles) {
        if (!RoleUtils.isLearner(roles)) {
            throw new CourseForbiddenException("Student or instructor role required.");
        }
    }

    private Course requireManageableCourse(UUID courseId, UUID actorUserId, String roles) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Course not found: " + courseId));
        if (!RoleUtils.isAdmin(roles) && !course.getInstructorId().equals(actorUserId)) {
            throw new CourseForbiddenException("Course owner or admin role required.");
        }
        return course;
    }

    private void setReview(Enrollment enrollment, UUID reviewerId, String note) {
        enrollment.setReviewedBy(reviewerId);
        enrollment.setReviewedAt(Instant.now());
        enrollment.setReviewNote(blankToNull(note));
    }

    private void clearReview(Enrollment enrollment) {
        enrollment.setReviewedBy(null);
        enrollment.setReviewedAt(null);
        enrollment.setReviewNote(null);
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
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
                            student != null ? student.avatarUrl() : null,
                            student != null ? student.role() : null);
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
