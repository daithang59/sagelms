package dev.sagelms.challenge.dto;

import dev.sagelms.challenge.entity.ChallengeQuestion;
import dev.sagelms.challenge.entity.ChallengeQuestionType;
import dev.sagelms.challenge.entity.QuestionMediaType;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ChallengeQuestionResponse(
        UUID id,
        UUID questionSetId,
        String title,
        String prompt,
        ChallengeQuestionType type,
        QuestionMediaType mediaType,
        String mediaUrl,
        BigDecimal points,
        Integer sortOrder,
        List<ChallengeChoiceResponse> choices
) {
    public static ChallengeQuestionResponse from(
            ChallengeQuestion question,
            List<ChallengeChoiceResponse> choices) {
        return new ChallengeQuestionResponse(
                question.getId(),
                question.getQuestionSet().getId(),
                question.getTitle(),
                question.getPrompt(),
                question.getType(),
                question.getMediaType(),
                question.getMediaUrl(),
                question.getPoints(),
                question.getSortOrder(),
                choices);
    }
}
