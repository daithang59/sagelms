package dev.sagelms.assessment.dto;

import dev.sagelms.assessment.entity.AssessmentQuestionType;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AssessmentAnswerResultResponse(
        UUID questionId,
        String questionTitle,
        String prompt,
        AssessmentQuestionType type,
        BigDecimal points,
        List<AssessmentChoiceResponse> choices,
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



