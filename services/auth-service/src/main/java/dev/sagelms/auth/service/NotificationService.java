package dev.sagelms.auth.service;

import dev.sagelms.auth.dto.*;
import dev.sagelms.auth.entity.Notification;
import dev.sagelms.auth.entity.NotificationPreference;
import dev.sagelms.auth.entity.NotificationType;
import dev.sagelms.auth.repository.NotificationPreferenceRepository;
import dev.sagelms.auth.repository.NotificationRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            NotificationPreferenceRepository preferenceRepository) {
        this.notificationRepository = notificationRepository;
        this.preferenceRepository = preferenceRepository;
    }

    public NotificationResponse create(NotificationRequest request) {
        if (request == null || request.userId() == null) {
            throw new IllegalArgumentException("Notification userId is required.");
        }
        NotificationPreference preference = getOrCreatePreference(request.userId());
        if (!preference.isInAppEnabled() || !isTypeEnabled(preference, request.type())) {
            return null;
        }

        Notification notification = new Notification();
        notification.setUserId(request.userId());
        notification.setType(request.type() != null ? request.type() : NotificationType.SYSTEM);
        notification.setTitle(required(request.title(), "Notification title is required."));
        notification.setMessage(blankToNull(request.message()));
        notification.setTargetUrl(blankToNull(request.targetUrl()));
        return NotificationResponse.from(notificationRepository.save(notification));
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(UUID userId, int limit) {
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, Math.max(1, Math.min(limit, 50))))
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    public NotificationResponse markRead(UUID userId, UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotificationNotFoundException(notificationId));
        if (!notification.getUserId().equals(userId)) {
            throw new NotificationNotFoundException(notificationId);
        }
        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
            notification = notificationRepository.save(notification);
        }
        return NotificationResponse.from(notification);
    }

    public void markAllRead(UUID userId) {
        notificationRepository.markAllRead(userId, Instant.now());
    }

    public NotificationPreferenceResponse getPreferences(UUID userId) {
        return NotificationPreferenceResponse.from(getOrCreatePreference(userId));
    }

    public NotificationPreferenceResponse updatePreferences(UUID userId, NotificationPreferenceRequest request) {
        NotificationPreference preference = getOrCreatePreference(userId);
        if (request.inAppEnabled() != null) {
            preference.setInAppEnabled(request.inAppEnabled());
        }
        if (request.emailEnabled() != null) {
            preference.setEmailEnabled(request.emailEnabled());
        }
        if (request.enrollmentRequests() != null) {
            preference.setEnrollmentRequests(request.enrollmentRequests());
        }
        if (request.enrollmentResults() != null) {
            preference.setEnrollmentResults(request.enrollmentResults());
        }
        if (request.courseUpdates() != null) {
            preference.setCourseUpdates(request.courseUpdates());
        }
        return NotificationPreferenceResponse.from(preferenceRepository.save(preference));
    }

    private NotificationPreference getOrCreatePreference(UUID userId) {
        return preferenceRepository.findByUserId(userId)
                .orElseGet(() -> {
                    NotificationPreference preference = new NotificationPreference();
                    preference.setUserId(userId);
                    return preferenceRepository.save(preference);
                });
    }

    private boolean isTypeEnabled(NotificationPreference preference, NotificationType type) {
        if (type == NotificationType.ENROLLMENT_REQUESTED) {
            return preference.isEnrollmentRequests();
        }
        if (type == NotificationType.ENROLLMENT_APPROVED || type == NotificationType.ENROLLMENT_REJECTED
                || type == NotificationType.COURSE_ENROLLED) {
            return preference.isEnrollmentResults();
        }
        return true;
    }

    private String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    public static class NotificationNotFoundException extends RuntimeException {
        public NotificationNotFoundException(UUID notificationId) {
            super("Notification not found: " + notificationId);
        }
    }
}
