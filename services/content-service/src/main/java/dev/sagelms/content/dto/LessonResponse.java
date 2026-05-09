package dev.sagelms.content.dto;

import dev.sagelms.content.entity.ContentType;
import dev.sagelms.content.entity.Lesson;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for lesson data
 */
public record LessonResponse(
        UUID id,
        UUID courseId,
        UUID instructorId,
        String title,
        ContentType type,
        String contentUrl,
        String textContent,
        Integer sortOrder,
        Integer durationMinutes,
        Boolean isPublished,
        Instant createdAt,
        Instant updatedAt
) {
    /**
     * Convert entity to response DTO
     */
    public static LessonResponse fromEntity(Lesson lesson) {
        return new LessonResponse(
                lesson.getId(),
                lesson.getCourseId(),
                lesson.getInstructorId(),
                lesson.getTitle(),
                lesson.getType(),
                lesson.getContentUrl(),
                lesson.getTextContent(),
                lesson.getSortOrder(),
                lesson.getDurationMinutes(),
                lesson.getIsPublished(),
                lesson.getCreatedAt(),
                lesson.getUpdatedAt()
        );
    }
}
