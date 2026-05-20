package dev.sagelms.assessment.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StartAttemptResponse(
        UUID id,
        UUID assessmentId,
        UUID questionSetId,
        UUID participantId,
        Instant startedAt,
        Integer timeLimitMinutes,
        List<AssessmentQuestionResponse> questions
) {}



