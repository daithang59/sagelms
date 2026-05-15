package dev.sagelms.challenge.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import dev.sagelms.challenge.entity.GradingStatus;

public record ChallengeAttemptResultResponse(
        UUID id,
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
        Instant gradedAt,
        List<ChallengeAnswerResultResponse> answers
) {}
