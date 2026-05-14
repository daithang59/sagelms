package dev.sagelms.challenge.dto;

import java.util.List;

public record ChallengeQuestionSetDetailResponse(
        ChallengeQuestionSetResponse questionSet,
        List<ChallengeQuestionResponse> questions
) {}
