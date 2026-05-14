package dev.sagelms.challenge.dto;

import dev.sagelms.challenge.entity.ChallengeStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ChallengeRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 2000) String description,
        @Size(max = 1000) String thumbnailUrl,
        @Size(max = 120) String category,
        ChallengeStatus status,
        Integer timeLimitMinutes,
        BigDecimal passScore,
        Integer maxAttempts
) {}
