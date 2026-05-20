package dev.sagelms.assessment.dto;

import dev.sagelms.assessment.entity.AssessmentChoice;

import java.util.UUID;

public record AssessmentChoiceResponse(
        UUID id,
        String text,
        Boolean isCorrect,
        Integer sortOrder
) {
    public static AssessmentChoiceResponse from(AssessmentChoice choice, boolean revealCorrect) {
        return new AssessmentChoiceResponse(
                choice.getId(),
                choice.getText(),
                revealCorrect ? choice.getIsCorrect() : null,
                choice.getSortOrder());
    }
}



