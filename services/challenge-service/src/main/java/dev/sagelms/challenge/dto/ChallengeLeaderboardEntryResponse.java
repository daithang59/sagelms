package dev.sagelms.challenge.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ChallengeLeaderboardEntryResponse(
        int rank,
        UUID participantId,
        String participantEmail,
        long completedQuestionSets,
        long totalQuestionSets,
        long totalUsedSeconds,
        long totalLimitSeconds,
        BigDecimal accuracyPercent,
        BigDecimal rankingScore,
        Instant firstStartedAt
) {}
