package dev.sagelms.challenge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChallengeQuestionSetRequest(
        @NotBlank @Size(max = 255) String title,
        Integer timeLimitMinutes,
        Integer sortOrder
) {}
