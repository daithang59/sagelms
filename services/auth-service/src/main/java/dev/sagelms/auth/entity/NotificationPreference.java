package dev.sagelms.auth.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "notification_preferences", schema = "auth")
public class NotificationPreference extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "in_app_enabled", nullable = false)
    private boolean inAppEnabled = true;

    @Column(name = "email_enabled", nullable = false)
    private boolean emailEnabled = false;

    @Column(name = "enrollment_requests", nullable = false)
    private boolean enrollmentRequests = true;

    @Column(name = "enrollment_results", nullable = false)
    private boolean enrollmentResults = true;

    @Column(name = "course_updates", nullable = false)
    private boolean courseUpdates = true;

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public boolean isInAppEnabled() { return inAppEnabled; }
    public void setInAppEnabled(boolean inAppEnabled) { this.inAppEnabled = inAppEnabled; }

    public boolean isEmailEnabled() { return emailEnabled; }
    public void setEmailEnabled(boolean emailEnabled) { this.emailEnabled = emailEnabled; }

    public boolean isEnrollmentRequests() { return enrollmentRequests; }
    public void setEnrollmentRequests(boolean enrollmentRequests) { this.enrollmentRequests = enrollmentRequests; }

    public boolean isEnrollmentResults() { return enrollmentResults; }
    public void setEnrollmentResults(boolean enrollmentResults) { this.enrollmentResults = enrollmentResults; }

    public boolean isCourseUpdates() { return courseUpdates; }
    public void setCourseUpdates(boolean courseUpdates) { this.courseUpdates = courseUpdates; }
}
