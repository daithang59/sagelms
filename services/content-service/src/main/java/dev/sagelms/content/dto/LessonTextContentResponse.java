package dev.sagelms.content.dto;

import java.util.UUID;

public record LessonTextContentResponse(
        UUID lessonId,
        UUID courseId,
        String title,
        String textContent
) {}
