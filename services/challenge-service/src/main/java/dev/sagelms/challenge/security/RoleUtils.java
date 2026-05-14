package dev.sagelms.challenge.security;

import java.util.Arrays;

public final class RoleUtils {
    private RoleUtils() {}

    public static boolean isAdmin(String roles) {
        return hasRole(roles, "ADMIN");
    }

    public static boolean isInstructor(String roles) {
        return hasRole(roles, "INSTRUCTOR");
    }

    public static boolean isInstructorOrAdmin(String roles) {
        return isInstructor(roles) || isAdmin(roles);
    }

    private static boolean hasRole(String roles, String role) {
        if (roles == null || roles.isBlank()) {
            return false;
        }
        return Arrays.stream(roles.split(","))
                .map(String::trim)
                .anyMatch(role::equals);
    }
}
