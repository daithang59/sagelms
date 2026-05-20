package dev.sagelms.assessment.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record GradeAssessmentAnswerRequest(
        @NotNull UUID questionId,
        @NotNull Boolean isCorrect
) {}



