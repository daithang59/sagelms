package dev.sagelms.assessment.dto;

import dev.sagelms.assessment.entity.AssessmentQuestionSet;

import java.util.UUID;

public record AssessmentQuestionSetResponse(
        UUID id,
        UUID assessmentId,
        String title,
        Integer timeLimitMinutes,
        Integer sortOrder,
        long questionCount,
        boolean completed,
        UUID latestSubmittedAttemptId,
        long attemptCount,
        Integer maxAttempts
) {
    public static AssessmentQuestionSetResponse from(
            AssessmentQuestionSet questionSet,
            long questionCount,
            boolean completed,
            UUID latestSubmittedAttemptId,
            long attemptCount) {
        return new AssessmentQuestionSetResponse(
                questionSet.getId(),
                questionSet.getAssessment().getId(),
                questionSet.getTitle(),
                questionSet.getTimeLimitMinutes(),
                questionSet.getSortOrder(),
                questionCount,
                completed,
                latestSubmittedAttemptId,
                attemptCount,
                questionSet.getMaxAttempts());
    }
}



