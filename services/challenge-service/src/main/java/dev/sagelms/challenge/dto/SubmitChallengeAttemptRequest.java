package dev.sagelms.challenge.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record SubmitChallengeAttemptRequest(
        @NotNull @Valid List<SubmitChallengeAnswerRequest> answers
) {}
