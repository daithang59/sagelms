package dev.sagelms.auth.dto;

import dev.sagelms.auth.entity.NotificationPreference;

public record NotificationPreferenceResponse(
        boolean inAppEnabled,
        boolean emailEnabled,
        boolean enrollmentRequests,
        boolean enrollmentResults,
        boolean courseUpdates
) {
    public static NotificationPreferenceResponse from(NotificationPreference preference) {
        return new NotificationPreferenceResponse(
                preference.isInAppEnabled(),
                preference.isEmailEnabled(),
                preference.isEnrollmentRequests(),
                preference.isEnrollmentResults(),
                preference.isCourseUpdates());
    }
}
