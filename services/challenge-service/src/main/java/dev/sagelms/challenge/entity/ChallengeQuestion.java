package dev.sagelms.challenge.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "challenge_questions", schema = "challenge")
public class ChallengeQuestion extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "challenge_id", nullable = false)
    private Challenge challenge;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_set_id", nullable = false)
    private ChallengeQuestionSet questionSet;

    @Column(name = "title")
    private String title;

    @Column(name = "prompt", nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private ChallengeQuestionType type = ChallengeQuestionType.MULTIPLE_CHOICE;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", length = 20)
    private QuestionMediaType mediaType = QuestionMediaType.NONE;

    @Column(name = "media_url", length = 1000)
    private String mediaUrl;

    @Column(name = "points", precision = 5, scale = 2)
    private BigDecimal points = new BigDecimal("1.00");

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    public Challenge getChallenge() { return challenge; }
    public void setChallenge(Challenge challenge) { this.challenge = challenge; }
    public ChallengeQuestionSet getQuestionSet() { return questionSet; }
    public void setQuestionSet(ChallengeQuestionSet questionSet) { this.questionSet = questionSet; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }
    public ChallengeQuestionType getType() { return type; }
    public void setType(ChallengeQuestionType type) { this.type = type; }
    public QuestionMediaType getMediaType() { return mediaType; }
    public void setMediaType(QuestionMediaType mediaType) { this.mediaType = mediaType; }
    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }
    public BigDecimal getPoints() { return points; }
    public void setPoints(BigDecimal points) { this.points = points; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
