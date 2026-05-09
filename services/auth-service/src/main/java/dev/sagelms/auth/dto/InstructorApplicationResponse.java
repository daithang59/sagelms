package dev.sagelms.auth.dto;

import java.util.UUID;

public record InstructorApplicationResponse(
        UUID userId,
        String status,
        String message
) {}
