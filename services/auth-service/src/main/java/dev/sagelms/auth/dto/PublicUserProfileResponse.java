package dev.sagelms.auth.dto;

import dev.sagelms.auth.entity.User;

import java.util.UUID;

public record PublicUserProfileResponse(
        UUID id,
        String email,
        String fullName
) {
    public static PublicUserProfileResponse from(User user) {
        return new PublicUserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName());
    }
}
