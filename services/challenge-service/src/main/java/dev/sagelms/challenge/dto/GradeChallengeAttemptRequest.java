package dev.sagelms.challenge.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record GradeChallengeAttemptRequest(
        @NotNull @Valid List<GradeChallengeAnswerRequest> answers
) {}
