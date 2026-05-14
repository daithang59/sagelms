package dev.sagelms.challenge.dto;

import dev.sagelms.challenge.entity.ChallengeChoice;

import java.util.UUID;

public record ChallengeChoiceResponse(
        UUID id,
        String text,
        Boolean isCorrect,
        Integer sortOrder
) {
    public static ChallengeChoiceResponse from(ChallengeChoice choice, boolean revealCorrect) {
        return new ChallengeChoiceResponse(
                choice.getId(),
                choice.getText(),
                revealCorrect ? choice.getIsCorrect() : null,
                choice.getSortOrder());
    }
}
