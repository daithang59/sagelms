package dev.sagelms.challenge.dto;

import dev.sagelms.challenge.entity.GradingStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ChallengeSubmissionSummaryResponse(
        UUID attemptId,
        UUID challengeId,
        UUID questionSetId,
        String questionSetTitle,
        UUID participantId,
        String participantEmail,
        BigDecimal score,
        BigDecimal maxScore,
        Boolean passed,
        GradingStatus gradingStatus,
        Instant startedAt,
        Instant submittedAt,
        Instant gradedAt
) {}
