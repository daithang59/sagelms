package dev.sagelms.auth.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Maps to auth.users table.
 */
@Entity
@Table(name = "users", schema = "auth")
public class User extends BaseEntity {

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name")
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "instructor_approval_status", nullable = false, length = 20)
    private InstructorApprovalStatus instructorApprovalStatus = InstructorApprovalStatus.APPROVED;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "instructor_headline", length = 255)
    private String instructorHeadline;

    @Column(name = "instructor_bio", length = 2000)
    private String instructorBio;

    @Column(name = "instructor_expertise", length = 500)
    private String instructorExpertise;

    @Column(name = "instructor_website", length = 500)
    private String instructorWebsite;

    @Column(name = "instructor_years_experience")
    private Integer instructorYearsExperience;

    @Column(name = "instructor_application_note", length = 2000)
    private String instructorApplicationNote;

    @Column(name = "instructor_reviewed_at")
    private Instant instructorReviewedAt;

    // ── Getters & Setters ──

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public InstructorApprovalStatus getInstructorApprovalStatus() { return instructorApprovalStatus; }
    public void setInstructorApprovalStatus(InstructorApprovalStatus instructorApprovalStatus) { this.instructorApprovalStatus = instructorApprovalStatus; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Instant getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(Instant lastLoginAt) { this.lastLoginAt = lastLoginAt; }

    public String getInstructorHeadline() { return instructorHeadline; }
    public void setInstructorHeadline(String instructorHeadline) { this.instructorHeadline = instructorHeadline; }

    public String getInstructorBio() { return instructorBio; }
    public void setInstructorBio(String instructorBio) { this.instructorBio = instructorBio; }

    public String getInstructorExpertise() { return instructorExpertise; }
    public void setInstructorExpertise(String instructorExpertise) { this.instructorExpertise = instructorExpertise; }

    public String getInstructorWebsite() { return instructorWebsite; }
    public void setInstructorWebsite(String instructorWebsite) { this.instructorWebsite = instructorWebsite; }

    public Integer getInstructorYearsExperience() { return instructorYearsExperience; }
    public void setInstructorYearsExperience(Integer instructorYearsExperience) { this.instructorYearsExperience = instructorYearsExperience; }

    public String getInstructorApplicationNote() { return instructorApplicationNote; }
    public void setInstructorApplicationNote(String instructorApplicationNote) { this.instructorApplicationNote = instructorApplicationNote; }

    public Instant getInstructorReviewedAt() { return instructorReviewedAt; }
    public void setInstructorReviewedAt(Instant instructorReviewedAt) { this.instructorReviewedAt = instructorReviewedAt; }
}
