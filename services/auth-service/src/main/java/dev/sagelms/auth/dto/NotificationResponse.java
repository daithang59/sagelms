package dev.sagelms.auth.dto;

import dev.sagelms.auth.entity.Notification;
import dev.sagelms.auth.entity.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        NotificationType type,
        String title,
        String message,
        String targetUrl,
        boolean read,
        Instant readAt,
        Instant createdAt
) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getTargetUrl(),
                notification.isRead(),
                notification.getReadAt(),
                notification.getCreatedAt());
    }
}
