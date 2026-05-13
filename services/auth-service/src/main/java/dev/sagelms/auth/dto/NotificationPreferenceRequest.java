package dev.sagelms.auth.dto;

public record NotificationPreferenceRequest(
        Boolean inAppEnabled,
        Boolean emailEnabled,
        Boolean enrollmentRequests,
        Boolean enrollmentResults,
        Boolean courseUpdates
) {}
