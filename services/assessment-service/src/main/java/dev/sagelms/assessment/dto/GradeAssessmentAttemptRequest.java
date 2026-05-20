package dev.sagelms.assessment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record GradeAssessmentAttemptRequest(
        @NotNull @Valid List<GradeAssessmentAnswerRequest> answers
) {}



