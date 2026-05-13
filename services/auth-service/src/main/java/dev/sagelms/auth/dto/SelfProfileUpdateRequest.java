package dev.sagelms.auth.dto;

public record SelfProfileUpdateRequest(
        String email,
        String fullName,
        String avatarUrl,
        String instructorHeadline,
        String instructorBio,
        String instructorExpertise,
        String instructorWebsite,
        Integer instructorYearsExperience
) {}
