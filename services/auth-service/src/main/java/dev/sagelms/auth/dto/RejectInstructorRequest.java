package dev.sagelms.auth.dto;

import jakarta.validation.constraints.Size;

public record RejectInstructorRequest(
        @Size(max = 2000) String reason
) {}
