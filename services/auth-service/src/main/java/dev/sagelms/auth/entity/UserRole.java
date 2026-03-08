package dev.sagelms.auth.entity;

/**
 * User roles — maps to CHECK constraint: role IN ('ADMIN', 'INSTRUCTOR', 'STUDENT')
 */
public enum UserRole {
    ADMIN,
    INSTRUCTOR,
    STUDENT
}
