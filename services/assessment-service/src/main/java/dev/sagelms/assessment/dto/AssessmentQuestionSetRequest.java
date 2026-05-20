package dev.sagelms.assessment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AssessmentQuestionSetRequest(
        @NotBlank @Size(max = 255) String title,
        Integer timeLimitMinutes,
        Integer sortOrder,
        Integer maxAttempts
) {}



