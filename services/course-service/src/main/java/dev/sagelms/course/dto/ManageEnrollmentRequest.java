package dev.sagelms.course.dto;

import jakarta.validation.constraints.Size;

public record ManageEnrollmentRequest(
        @Size(max = 1000) String reason
) {}
