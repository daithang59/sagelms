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
        return new CourseResponse(
                course.getId(),
                course.getTitle(),
                course.getDescription(),
                course.getThumbnailUrl(),
                course.getInstructorId(),
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
