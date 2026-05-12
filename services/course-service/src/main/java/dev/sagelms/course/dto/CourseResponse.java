package dev.sagelms.course.dto;

import dev.sagelms.course.entity.Course;
import dev.sagelms.course.entity.CourseStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for course data
 */
public record CourseResponse(
        UUID id,
        String title,
        String description,
        String thumbnailUrl,
        UUID instructorId,
        String instructorEmail,
        String instructorFullName,
        String instructorAvatarUrl,
        String instructorHeadline,
        String instructorBio,
        String instructorExpertise,
        String instructorWebsite,
        Integer instructorYearsExperience,
        CourseStatus status,
        String category,
        long enrollmentCount,
        Instant createdAt,
        Instant updatedAt
) {
    /**
     * Convert entity to response DTO
     */
    public static CourseResponse fromEntity(Course course, long enrollmentCount) {
        return fromEntity(course, enrollmentCount, null, null, null, null, null, null, null, null);
    }

    public static CourseResponse fromEntity(
            Course course,
            long enrollmentCount,
            String instructorEmail,
            String instructorFullName,
            String instructorAvatarUrl,
            String instructorHeadline,
            String instructorBio,
            String instructorExpertise,
            String instructorWebsite,
            Integer instructorYearsExperience) {
        return new CourseResponse(
                course.getId(),
                course.getTitle(),
                course.getDescription(),
                course.getThumbnailUrl(),
                course.getInstructorId(),
                instructorEmail,
                instructorFullName,
                instructorAvatarUrl,
                instructorHeadline,
                instructorBio,
                instructorExpertise,
                instructorWebsite,
                instructorYearsExperience,
                course.getStatus(),
                course.getCategory(),
                enrollmentCount,
                course.getCreatedAt(),
                course.getUpdatedAt()
        );
    }

    /**
     * Convert entity to response DTO (without enrollment count)
     */
    public static CourseResponse fromEntity(Course course) {
        return fromEntity(course, 0);
    }
}
