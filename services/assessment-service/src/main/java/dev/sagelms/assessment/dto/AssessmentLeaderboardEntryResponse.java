package dev.sagelms.assessment.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AssessmentLeaderboardEntryResponse(
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



