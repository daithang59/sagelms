package dev.sagelms.auth.dto;

import dev.sagelms.auth.entity.User;
import dev.sagelms.auth.entity.UserRole;
import dev.sagelms.auth.entity.InstructorApprovalStatus;

import java.time.Instant;
import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String email,
        String fullName,
        UserRole role,
        String avatarUrl,
        boolean isActive,
        InstructorApprovalStatus instructorApprovalStatus,
        String instructorHeadline,
        String instructorBio,
        String instructorExpertise,
        String instructorWebsite,
        Integer instructorYearsExperience,
        String instructorApplicationNote,
        Instant instructorReviewedAt,
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
                user.getInstructorApprovalStatus(),
                user.getInstructorHeadline(),
                user.getInstructorBio(),
                user.getInstructorExpertise(),
                user.getInstructorWebsite(),
                user.getInstructorYearsExperience(),
                user.getInstructorApplicationNote(),
                user.getInstructorReviewedAt(),
                user.getLastLoginAt(),
                user.getCreatedAt()
        );
    }
}
