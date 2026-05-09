package dev.sagelms.content.dto;

import dev.sagelms.content.entity.ContentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request DTO for creating/updating a lesson
 */
public record LessonRequest(
        @NotBlank(message = "Title is required")
        String title,

        @NotNull(message = "Content type is required")
        ContentType type,

        String contentUrl,

        String textContent,

        Integer sortOrder,

        Integer durationMinutes,

        Boolean isPublished,

        // For ownership verification - instructor who owns the course
        UUID instructorId
) {}
