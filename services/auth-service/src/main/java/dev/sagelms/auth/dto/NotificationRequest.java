package dev.sagelms.auth.dto;

import dev.sagelms.auth.entity.NotificationType;

import java.util.UUID;

public record NotificationRequest(
        UUID userId,
        NotificationType type,
        String title,
        String message,
        String targetUrl
) {}
