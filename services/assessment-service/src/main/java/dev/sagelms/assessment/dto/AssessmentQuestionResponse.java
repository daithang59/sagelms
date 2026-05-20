package dev.sagelms.assessment.dto;

import dev.sagelms.assessment.entity.AssessmentQuestion;
import dev.sagelms.assessment.entity.AssessmentQuestionType;
import dev.sagelms.assessment.entity.QuestionMediaType;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AssessmentQuestionResponse(
        UUID id,
        UUID questionSetId,
        String title,
        String prompt,
        AssessmentQuestionType type,
        QuestionMediaType mediaType,
        String mediaUrl,
        BigDecimal points,
        Integer sortOrder,
        List<AssessmentChoiceResponse> choices
) {
    public static AssessmentQuestionResponse from(
            AssessmentQuestion question,
            List<AssessmentChoiceResponse> choices) {
        return new AssessmentQuestionResponse(
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



