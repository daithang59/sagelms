package dev.sagelms.auth.api;

import dev.sagelms.auth.dto.NotificationRequest;
import dev.sagelms.auth.dto.NotificationResponse;
import dev.sagelms.auth.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/notifications")
public class InternalNotificationController {

    private final NotificationService notificationService;

    public InternalNotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping
    public ResponseEntity<NotificationResponse> create(@RequestBody NotificationRequest request) {
        NotificationResponse response = notificationService.create(request);
        return response != null ? ResponseEntity.ok(response) : ResponseEntity.noContent().build();
    }
}
