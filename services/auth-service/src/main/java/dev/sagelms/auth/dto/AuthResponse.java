package dev.sagelms.auth.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        long expiresIn,
        String tokenType,
        UserProfileResponse user
) {
    public AuthResponse(String accessToken, String refreshToken, long expiresIn, UserProfileResponse user) {
        this(accessToken, refreshToken, expiresIn, "Bearer", user);
    }
}
