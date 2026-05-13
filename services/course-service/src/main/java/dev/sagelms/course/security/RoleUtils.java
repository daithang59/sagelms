package dev.sagelms.course.security;

import java.util.Arrays;

public final class RoleUtils {

    private RoleUtils() {
    }

    public static boolean hasRole(String rolesHeader, String role) {
        if (rolesHeader == null || rolesHeader.isBlank()) {
            return false;
        }
        return Arrays.stream(rolesHeader.split(","))
                .map(String::trim)
                .anyMatch(role::equals);
    }

    public static boolean isAdmin(String rolesHeader) {
        return hasRole(rolesHeader, "ADMIN");
    }

    public static boolean isInstructorOrAdmin(String rolesHeader) {
        return hasRole(rolesHeader, "INSTRUCTOR") || isAdmin(rolesHeader);
    }

    public static boolean isStudent(String rolesHeader) {
        return hasRole(rolesHeader, "STUDENT");
    }

    public static boolean isLearner(String rolesHeader) {
        return isStudent(rolesHeader) || hasRole(rolesHeader, "INSTRUCTOR");
    }
}
