package dev.sagelms.assessment.dto;

import java.util.UUID;

public record SubmitAssessmentAnswerRequest(
        UUID questionId,
        UUID choiceId,
        String textAnswer,
        String fileName,
        String fileType,
        Long fileSize,
        String fileUrl
) {}



