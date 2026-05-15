package dev.sagelms.challenge.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StartAttemptResponse(
        UUID id,
        UUID challengeId,
        UUID questionSetId,
        UUID participantId,
        Instant startedAt,
        Integer timeLimitMinutes,
        List<ChallengeQuestionResponse> questions
) {}
