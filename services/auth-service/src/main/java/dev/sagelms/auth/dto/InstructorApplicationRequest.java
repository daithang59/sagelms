package dev.sagelms.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InstructorApplicationRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8) String password,
        @NotBlank @Size(max = 255) String fullName,
        @NotBlank @Size(max = 255) String headline,
        @NotBlank @Size(max = 2000) String bio,
        @NotBlank @Size(max = 500) String expertise,
        @Size(max = 500) String website,
        @Min(0) @Max(60) Integer yearsExperience,
        @Size(max = 2000) String applicationNote
) {}
