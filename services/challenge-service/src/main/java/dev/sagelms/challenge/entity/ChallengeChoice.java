package dev.sagelms.challenge.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "challenge_choices", schema = "challenge")
public class ChallengeChoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private java.util.UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private ChallengeQuestion question;

    @Column(name = "text", nullable = false, length = 500)
    private String text;

    @Column(name = "is_correct")
    private Boolean isCorrect = false;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    public java.util.UUID getId() { return id; }
    public void setId(java.util.UUID id) { this.id = id; }
    public ChallengeQuestion getQuestion() { return question; }
    public void setQuestion(ChallengeQuestion question) { this.question = question; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
