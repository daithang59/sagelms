package dev.sagelms.assessment.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "assessment_attempts", schema = "assessment")
public class AssessmentAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_set_id", nullable = false)
    private AssessmentQuestionSet questionSet;

    @Column(name = "participant_id", nullable = false)
    private UUID participantId;

    @Column(name = "participant_email")
    private String participantEmail;

    @Column(name = "score", precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "max_score", precision = 5, scale = 2)
    private BigDecimal maxScore;

    @Column(name = "passed")
    private Boolean passed;

    @Enumerated(EnumType.STRING)
    @Column(name = "grading_status", nullable = false, length = 30)
    private GradingStatus gradingStatus = GradingStatus.IN_PROGRESS;

    @Column(name = "started_at", updatable = false)
    private Instant startedAt = Instant.now();

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "graded_at")
    private Instant gradedAt;

    @Column(name = "graded_by")
    private UUID gradedBy;

    @Column(name = "used_seconds")
    private Long usedSeconds;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Assessment getAssessment() { return assessment; }
    public void setAssessment(Assessment assessment) { this.assessment = assessment; }
    public AssessmentQuestionSet getQuestionSet() { return questionSet; }
    public void setQuestionSet(AssessmentQuestionSet questionSet) { this.questionSet = questionSet; }
    public UUID getParticipantId() { return participantId; }
    public void setParticipantId(UUID participantId) { this.participantId = participantId; }
    public String getParticipantEmail() { return participantEmail; }
    public void setParticipantEmail(String participantEmail) { this.participantEmail = participantEmail; }
    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }
    public BigDecimal getMaxScore() { return maxScore; }
    public void setMaxScore(BigDecimal maxScore) { this.maxScore = maxScore; }
    public Boolean getPassed() { return passed; }
    public void setPassed(Boolean passed) { this.passed = passed; }
    public GradingStatus getGradingStatus() { return gradingStatus; }
    public void setGradingStatus(GradingStatus gradingStatus) { this.gradingStatus = gradingStatus; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
    public Instant getGradedAt() { return gradedAt; }
    public void setGradedAt(Instant gradedAt) { this.gradedAt = gradedAt; }
    public UUID getGradedBy() { return gradedBy; }
    public void setGradedBy(UUID gradedBy) { this.gradedBy = gradedBy; }
    public Long getUsedSeconds() { return usedSeconds; }
    public void setUsedSeconds(Long usedSeconds) { this.usedSeconds = usedSeconds; }
}


