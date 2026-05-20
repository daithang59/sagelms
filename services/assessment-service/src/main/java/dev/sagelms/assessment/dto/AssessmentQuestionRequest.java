package dev.sagelms.assessment.dto;

import dev.sagelms.assessment.entity.AssessmentQuestionType;
import dev.sagelms.assessment.entity.QuestionMediaType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record AssessmentQuestionRequest(
        @Size(max = 255) String title,
        @NotBlank @Size(max = 5000) String prompt,
        @NotNull AssessmentQuestionType type,
        QuestionMediaType mediaType,
        @Size(max = 1000) String mediaUrl,
        BigDecimal points,
        Integer sortOrder,
        @Valid List<AssessmentChoiceRequest> choices
) {}



