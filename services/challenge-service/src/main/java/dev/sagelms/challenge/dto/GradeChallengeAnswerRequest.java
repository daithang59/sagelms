package dev.sagelms.challenge.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record GradeChallengeAnswerRequest(
        @NotNull UUID questionId,
        @NotNull Boolean isCorrect
) {}
