package dev.sagelms.auth.dto;

import dev.sagelms.auth.entity.UserRole;
import dev.sagelms.auth.entity.InstructorApprovalStatus;

public record UpdateUserRequest(
        String email,
        String fullName,
        UserRole role,
        Boolean isActive,
        String avatarUrl,
        InstructorApprovalStatus instructorApprovalStatus,
        String instructorHeadline,
        String instructorBio,
        String instructorExpertise,
        String instructorWebsite,
        Integer instructorYearsExperience,
        String instructorApplicationNote
) {}
