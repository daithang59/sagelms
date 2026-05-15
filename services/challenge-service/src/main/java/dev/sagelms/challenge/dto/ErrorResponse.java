package dev.sagelms.challenge.dto;

import java.time.Instant;

public record ErrorResponse(
        Instant timestamp,
        String path,
        String errorCode,
        String message,
        String correlationId
) {}
