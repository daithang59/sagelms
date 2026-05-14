package dev.sagelms.challenge.dto;

import dev.sagelms.challenge.entity.ChallengeQuestionSet;

import java.util.UUID;

public record ChallengeQuestionSetResponse(
        UUID id,
        UUID challengeId,
        String title,
        Integer timeLimitMinutes,
        Integer sortOrder,
        long questionCount,
        boolean completed,
        UUID latestSubmittedAttemptId,
        long attemptCount
) {
    public static ChallengeQuestionSetResponse from(
            ChallengeQuestionSet questionSet,
            long questionCount,
            boolean completed,
            UUID latestSubmittedAttemptId,
            long attemptCount) {
        return new ChallengeQuestionSetResponse(
                questionSet.getId(),
                questionSet.getChallenge().getId(),
                questionSet.getTitle(),
                questionSet.getTimeLimitMinutes(),
                questionSet.getSortOrder(),
                questionCount,
                completed,
                latestSubmittedAttemptId,
                attemptCount);
    }
}
