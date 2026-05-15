package dev.sagelms.challenge.dto;

import java.util.List;

public record ChallengeDetailResponse(
        ChallengeResponse challenge,
        List<ChallengeQuestionResponse> questions,
        List<ChallengeQuestionSetResponse> questionSets
) {}
