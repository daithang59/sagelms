package dev.sagelms.progress.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "lesson_progress", schema = "progress",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "lesson_id"}))
public class LessonProgress extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;  // soft ref → auth.users

    @Column(name = "lesson_id", nullable = false)
    private UUID lessonId;  // soft ref → content.lessons

    @Column(name = "course_id", nullable = false)
    private UUID courseId;  // soft ref → course.courses (denormalized)

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private ProgressStatus status = ProgressStatus.NOT_STARTED;

    @Column(name = "completed_at")
    private Instant completedAt;

    // ── Getters & Setters ──

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getLessonId() { return lessonId; }
    public void setLessonId(UUID lessonId) { this.lessonId = lessonId; }

    public UUID getCourseId() { return courseId; }
    public void setCourseId(UUID courseId) { this.courseId = courseId; }

    public ProgressStatus getStatus() { return status; }
    public void setStatus(ProgressStatus status) { this.status = status; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
