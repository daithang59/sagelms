package dev.sagelms.challenge.dto;

import dev.sagelms.challenge.entity.Challenge;
import dev.sagelms.challenge.entity.ChallengeStatus;

import java.time.Instant;
import java.util.UUID;

public record ChallengeResponse(
        UUID id,
        String title,
        String description,
        String thumbnailUrl,
        String category,
        ChallengeStatus status,
        UUID instructorId,
        Integer timeLimitMinutes,
        Integer maxAttempts,
        long questionCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static ChallengeResponse from(Challenge challenge, long questionCount) {
        return new ChallengeResponse(
                challenge.getId(),
                challenge.getTitle(),
                challenge.getDescription(),
                challenge.getThumbnailUrl(),
                challenge.getCategory(),
                challenge.getStatus(),
                challenge.getInstructorId(),
                challenge.getTimeLimitMinutes(),
                challenge.getMaxAttempts(),
                questionCount,
                challenge.getCreatedAt(),
                challenge.getUpdatedAt());
    }
}
