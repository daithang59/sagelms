package dev.sagelms.assessment.dto;

import java.util.List;

public record AssessmentQuestionSetDetailResponse(
        AssessmentQuestionSetResponse questionSet,
        List<AssessmentQuestionResponse> questions
) {}



