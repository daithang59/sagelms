package dev.sagelms.auth.api;

import dev.sagelms.auth.dto.UserProfileResponse;
import dev.sagelms.auth.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/internal/users")
public class InternalUserController {

    private final AuthService authService;

    public InternalUserController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/profiles")
    public ResponseEntity<List<UserProfileResponse>> getUserProfiles(@RequestBody List<UUID> userIds) {
        return ResponseEntity.ok(authService.getUsersByIds(userIds));
    }
}
