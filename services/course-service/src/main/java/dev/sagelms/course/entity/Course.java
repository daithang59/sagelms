package dev.sagelms.course.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "courses", schema = "course")
public class Course extends BaseEntity {

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "instructor_id", nullable = false)
    private UUID instructorId;  // soft ref → auth.users

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private CourseStatus status = CourseStatus.DRAFT;

    @Column(name = "category", length = 100)
    private String category;

    // ── Getters & Setters ──

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public UUID getInstructorId() { return instructorId; }
    public void setInstructorId(UUID instructorId) { this.instructorId = instructorId; }

    public CourseStatus getStatus() { return status; }
    public void setStatus(CourseStatus status) { this.status = status; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}
