package dev.sagelms.auth.dto;

import java.time.Instant;

public record ErrorResponse(
        Instant timestamp,
        String path,
        String errorCode,
        String message
) {
    public ErrorResponse(String path, String errorCode, String message) {
        this(Instant.now(), path, errorCode, message);
    }
}
