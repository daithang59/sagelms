package dev.sagelms.assessment.dto;

import dev.sagelms.assessment.entity.GradingStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AssessmentSubmissionSummaryResponse(
        UUID attemptId,
        UUID assessmentId,
        UUID courseId,
        String assessmentTitle,
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
        Long usedSeconds
) {}



