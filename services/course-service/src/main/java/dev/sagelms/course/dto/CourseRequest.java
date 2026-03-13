package dev.sagelms.course.dto;

import dev.sagelms.course.entity.CourseStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for creating/updating a course
 */
public record CourseRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title must not exceed 255 characters")
        String title,

        String description,

        @Size(max = 500, message = "Thumbnail URL must not exceed 500 characters")
        String thumbnailUrl,

        @NotNull(message = "Status is required")
        CourseStatus status,

        @Size(max = 100, message = "Category must not exceed 100 characters")
        String category
) {}
