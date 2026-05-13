package dev.sagelms.auth.api;

import dev.sagelms.auth.dto.UpdateUserRequest;
import dev.sagelms.auth.dto.UserProfileResponse;
import dev.sagelms.auth.dto.RejectInstructorRequest;
import dev.sagelms.auth.entity.InstructorApprovalStatus;
import dev.sagelms.auth.entity.UserRole;
import dev.sagelms.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private static final String ROLES_HEADER = "X-User-Roles";
    private static final String USER_ID_HEADER = "X-User-Id";

    private final AuthService authService;

    public UserController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listUsers(
            @RequestHeader(value = ROLES_HEADER, required = false) String roles,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String search) {

        requireAdmin(roles);

        Page<UserProfileResponse> result = authService.listUsers(role, isActive, search, page, size);

        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("page", result.getNumber() + 1);
        meta.put("size", result.getSize());
        meta.put("totalElements", result.getTotalElements());
        meta.put("totalPages", result.getTotalPages());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("data", result.getContent());
        body.put("meta", meta);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/instructor-applications")
    public ResponseEntity<Map<String, Object>> listInstructorApplications(
            @RequestHeader(value = ROLES_HEADER, required = false) String roles,
            @RequestParam(defaultValue = "PENDING") InstructorApprovalStatus status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        requireAdmin(roles);

        Page<UserProfileResponse> result = authService.listInstructorApplications(status, page, size);

        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("page", result.getNumber() + 1);
        meta.put("size", result.getSize());
        meta.put("totalElements", result.getTotalElements());
        meta.put("totalPages", result.getTotalPages());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("data", result.getContent());
        body.put("meta", meta);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/{userId}/approve-instructor")
    public ResponseEntity<UserProfileResponse> approveInstructor(
            @RequestHeader(value = ROLES_HEADER, required = false) String roles,
            @PathVariable UUID userId) {
        requireAdmin(roles);
        return ResponseEntity.ok(authService.approveInstructor(userId));
    }

    @PostMapping("/{userId}/reject-instructor")
    public ResponseEntity<UserProfileResponse> rejectInstructor(
            @RequestHeader(value = ROLES_HEADER, required = false) String roles,
            @PathVariable UUID userId,
            @Valid @RequestBody(required = false) RejectInstructorRequest request) {
        requireAdmin(roles);
        return ResponseEntity.ok(authService.rejectInstructor(userId, request != null ? request.reason() : null));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserProfileResponse> getUserById(
            @RequestHeader(value = ROLES_HEADER, required = false) String roles,
            @PathVariable UUID userId) {
        requireAdmin(roles);
        return ResponseEntity.ok(authService.getUserById(userId));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserProfileResponse> updateUser(
            @RequestHeader(value = ROLES_HEADER, required = false) String roles,
            @RequestHeader(value = USER_ID_HEADER, required = false) UUID actorUserId,
            @PathVariable UUID userId,
            @RequestBody UpdateUserRequest request) {
        requireAdmin(roles);
        return ResponseEntity.ok(authService.updateUser(userId, actorUserId, request));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(
            @RequestHeader(value = ROLES_HEADER, required = false) String roles,
            @RequestHeader(value = USER_ID_HEADER, required = false) UUID actorUserId,
            @PathVariable UUID userId) {
        requireAdmin(roles);
        authService.deleteUser(userId, actorUserId);
        return ResponseEntity.noContent().build();
    }

    private void requireAdmin(String roles) {
        if (roles == null || Arrays.stream(roles.split(","))
                .map(String::trim)
                .noneMatch("ADMIN"::equals)) {
            throw new ForbiddenException();
        }
    }

    public static class ForbiddenException extends RuntimeException {
        public ForbiddenException() {
            super("Admin role required.");
        }
    }
}
