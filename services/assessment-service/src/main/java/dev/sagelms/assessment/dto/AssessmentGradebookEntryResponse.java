package dev.sagelms.assessment.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record AssessmentGradebookEntryResponse(
        UUID participantId,
        String participantEmail,
        long gradedAttempts,
        long submittedAttempts,
        BigDecimal totalScore,
        BigDecimal totalMaxScore,
        BigDecimal averageScore
) {}

