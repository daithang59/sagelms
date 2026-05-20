package dev.sagelms.assessment.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "assessment_question_sets", schema = "assessment")
public class AssessmentQuestionSet extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "time_limit_minutes")
    private Integer timeLimitMinutes;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "max_attempts")
    private Integer maxAttempts;

    public Assessment getAssessment() { return assessment; }
    public void setAssessment(Assessment assessment) { this.assessment = assessment; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getTimeLimitMinutes() { return timeLimitMinutes; }
    public void setTimeLimitMinutes(Integer timeLimitMinutes) { this.timeLimitMinutes = timeLimitMinutes; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public Integer getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(Integer maxAttempts) { this.maxAttempts = maxAttempts; }
}


