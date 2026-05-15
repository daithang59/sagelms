package dev.sagelms.challenge.dto;

import java.util.UUID;

public record SubmitChallengeAnswerRequest(
        UUID questionId,
        UUID choiceId,
        String textAnswer,
        String fileName,
        String fileType,
        Long fileSize,
        String fileUrl
) {}
