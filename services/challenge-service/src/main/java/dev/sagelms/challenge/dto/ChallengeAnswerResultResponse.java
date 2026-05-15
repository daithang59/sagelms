package dev.sagelms.challenge.dto;

import dev.sagelms.challenge.entity.ChallengeQuestionType;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ChallengeAnswerResultResponse(
        UUID questionId,
        String questionTitle,
        String prompt,
        ChallengeQuestionType type,
        BigDecimal points,
        List<ChallengeChoiceResponse> choices,
        UUID selectedChoiceId,
        String selectedChoiceText,
        UUID correctChoiceId,
        String correctChoiceText,
        Boolean isCorrect,
        String textAnswer,
        String fileName,
        String fileType,
        Long fileSize,
        String status
) {}
