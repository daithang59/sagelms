package dev.sagelms.assessment.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import dev.sagelms.assessment.entity.GradingStatus;

public record AssessmentAttemptResultResponse(
        UUID id,
        UUID assessmentId,
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
        Long usedSeconds,
        List<AssessmentAnswerResultResponse> answers
) {}



