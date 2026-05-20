package dev.sagelms.assessment.dto;

import dev.sagelms.assessment.entity.Assessment;
import dev.sagelms.assessment.entity.AssessmentStatus;

import java.time.Instant;
import java.util.UUID;

public record AssessmentResponse(
        UUID id,
        String title,
        String description,
        String thumbnailUrl,
        String category,
        UUID courseId,
        AssessmentStatus status,
        UUID instructorId,
        Integer timeLimitMinutes,
        Integer maxAttempts,
        long questionCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static AssessmentResponse from(Assessment Assessment, long questionCount) {
        return new AssessmentResponse(
                Assessment.getId(),
                Assessment.getTitle(),
                Assessment.getDescription(),
                Assessment.getThumbnailUrl(),
                Assessment.getCategory(),
                Assessment.getCourseId(),
                Assessment.getStatus(),
                Assessment.getInstructorId(),
                Assessment.getTimeLimitMinutes(),
                Assessment.getMaxAttempts(),
                questionCount,
                Assessment.getCreatedAt(),
                Assessment.getUpdatedAt());
    }
}



