package dev.sagelms.assessment.dto;

import dev.sagelms.assessment.entity.AssessmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AssessmentRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 2000) String description,
        @Size(max = 1000) String thumbnailUrl,
        @Size(max = 120) String category,
        AssessmentStatus status,
        Integer timeLimitMinutes,
        Integer maxAttempts
) {}



