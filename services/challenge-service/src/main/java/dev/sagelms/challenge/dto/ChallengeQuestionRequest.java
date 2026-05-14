package dev.sagelms.challenge.dto;

import dev.sagelms.challenge.entity.ChallengeQuestionType;
import dev.sagelms.challenge.entity.QuestionMediaType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record ChallengeQuestionRequest(
        @Size(max = 255) String title,
        @NotBlank @Size(max = 5000) String prompt,
        @NotNull ChallengeQuestionType type,
        QuestionMediaType mediaType,
        @Size(max = 1000) String mediaUrl,
        BigDecimal points,
        Integer sortOrder,
        @Valid List<ChallengeChoiceRequest> choices
) {}
