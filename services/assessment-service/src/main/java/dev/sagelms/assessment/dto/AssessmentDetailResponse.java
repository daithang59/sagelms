package dev.sagelms.assessment.dto;

import java.util.List;

public record AssessmentDetailResponse(
        AssessmentResponse assessment,
        List<AssessmentQuestionResponse> questions,
        List<AssessmentQuestionSetResponse> questionSets
) {}



