package dev.sagelms.challenge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChallengeChoiceRequest(
        @NotBlank @Size(max = 500) String text,
        Boolean isCorrect,
        Integer sortOrder
) {}
