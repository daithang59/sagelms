package dev.sagelms.course.dto;

import dev.sagelms.course.entity.Enrollment;
import dev.sagelms.course.entity.EnrollmentStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for enrollment data
 */
public record EnrollmentResponse(
        UUID id,
        UUID courseId,
        String courseTitle,
        UUID studentId,
        String studentEmail,
        Instant enrolledAt,
        EnrollmentStatus status
) {
    /**
     * Convert entity to response DTO
     */
    public static EnrollmentResponse fromEntity(Enrollment enrollment) {
        return new EnrollmentResponse(
                enrollment.getId(),
                enrollment.getCourseId(),
                null, // courseTitle - can be loaded separately if needed
                enrollment.getStudentId(),
                null, // studentEmail - can be loaded separately if needed
                enrollment.getEnrolledAt(),
                enrollment.getStatus()
        );
    }

    /**
     * Convert entity with additional data
     */
    public static EnrollmentResponse fromEntity(Enrollment enrollment, String courseTitle, String studentEmail) {
        return new EnrollmentResponse(
                enrollment.getId(),
                enrollment.getCourseId(),
                courseTitle,
                enrollment.getStudentId(),
                studentEmail,
                enrollment.getEnrolledAt(),
                enrollment.getStatus()
        );
    }
}
