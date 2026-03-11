package dev.sagelms.auth.dto;

import dev.sagelms.auth.entity.User;
import dev.sagelms.auth.entity.UserRole;

import java.time.Instant;
import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String email,
        String fullName,
        UserRole role,
        String avatarUrl,
        boolean isActive,
        Instant lastLoginAt,
        Instant createdAt
) {
    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getAvatarUrl(),
                Boolean.TRUE.equals(user.getIsActive()),
                user.getLastLoginAt(),
                user.getCreatedAt()
        );
    }
}
