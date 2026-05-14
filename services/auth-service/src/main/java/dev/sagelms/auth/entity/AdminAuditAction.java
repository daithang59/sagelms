package dev.sagelms.auth.entity;

public enum AdminAuditAction {
    LOCK_USER,
    UNLOCK_USER,
    DEACTIVATE_USER,
    CHANGE_ROLE,
    APPROVE_INSTRUCTOR,
    REJECT_INSTRUCTOR,
    UPDATE_USER_PROFILE
}
