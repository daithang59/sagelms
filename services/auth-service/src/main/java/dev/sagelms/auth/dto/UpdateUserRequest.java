package dev.sagelms.auth.dto;

import dev.sagelms.auth.entity.UserRole;

public record UpdateUserRequest(
        UserRole role,
        Boolean isActive
) {}
