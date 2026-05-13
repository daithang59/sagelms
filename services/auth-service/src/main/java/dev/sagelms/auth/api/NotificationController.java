package dev.sagelms.auth.api;

import dev.sagelms.auth.dto.NotificationPreferenceRequest;
import dev.sagelms.auth.dto.NotificationPreferenceResponse;
import dev.sagelms.auth.dto.NotificationResponse;
import dev.sagelms.auth.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private static final String USER_ID_HEADER = "X-User-Id";

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> list(
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(notificationService.list(userId, limit));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> unreadCount(@RequestHeader(USER_ID_HEADER) UUID userId) {
        return ResponseEntity.ok(new UnreadCountResponse(notificationService.unreadCount(userId)));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markRead(
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @PathVariable UUID notificationId) {
        return ResponseEntity.ok(notificationService.markRead(userId, notificationId));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@RequestHeader(USER_ID_HEADER) UUID userId) {
        notificationService.markAllRead(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/preferences")
    public ResponseEntity<NotificationPreferenceResponse> getPreferences(@RequestHeader(USER_ID_HEADER) UUID userId) {
        return ResponseEntity.ok(notificationService.getPreferences(userId));
    }

    @PutMapping("/preferences")
    public ResponseEntity<NotificationPreferenceResponse> updatePreferences(
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestBody NotificationPreferenceRequest request) {
        return ResponseEntity.ok(notificationService.updatePreferences(userId, request));
    }

    public record UnreadCountResponse(long unreadCount) {}
}
