package dev.sagelms.content.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "lessons", schema = "content",
       uniqueConstraints = @UniqueConstraint(columnNames = {"course_id", "sort_order"}))
public class Lesson extends BaseEntity {

    @Column(name = "course_id", nullable = false)
    private UUID courseId;  // soft ref → course.courses

    @Column(name = "title", nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private ContentType type;

    @Column(name = "content_url", length = 500)
    private String contentUrl;

    @Column(name = "text_content", columnDefinition = "TEXT")
    private String textContent;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "is_published")
    private Boolean isPublished = false;

    // ── Getters & Setters ──

    public UUID getCourseId() { return courseId; }
    public void setCourseId(UUID courseId) { this.courseId = courseId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public ContentType getType() { return type; }
    public void setType(ContentType type) { this.type = type; }

    public String getContentUrl() { return contentUrl; }
    public void setContentUrl(String contentUrl) { this.contentUrl = contentUrl; }

    public String getTextContent() { return textContent; }
    public void setTextContent(String textContent) { this.textContent = textContent; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public Boolean getIsPublished() { return isPublished; }
    public void setIsPublished(Boolean isPublished) { this.isPublished = isPublished; }
}
