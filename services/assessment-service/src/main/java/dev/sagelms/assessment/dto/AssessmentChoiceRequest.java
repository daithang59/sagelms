package dev.sagelms.assessment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AssessmentChoiceRequest(
        @NotBlank @Size(max = 500) String text,
        Boolean isCorrect,
        Integer sortOrder
) {}



