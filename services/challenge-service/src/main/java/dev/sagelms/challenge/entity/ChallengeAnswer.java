package dev.sagelms.challenge.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "challenge_answers", schema = "challenge",
       uniqueConstraints = @UniqueConstraint(columnNames = {"attempt_id", "question_id"}))
public class ChallengeAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private ChallengeAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private ChallengeQuestion question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "choice_id")
    private ChallengeChoice choice;

    @Column(name = "text_answer", columnDefinition = "TEXT")
    private String textAnswer;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_type")
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_url", length = 1000)
    private String fileUrl;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public ChallengeAttempt getAttempt() { return attempt; }
    public void setAttempt(ChallengeAttempt attempt) { this.attempt = attempt; }
    public ChallengeQuestion getQuestion() { return question; }
    public void setQuestion(ChallengeQuestion question) { this.question = question; }
    public ChallengeChoice getChoice() { return choice; }
    public void setChoice(ChallengeChoice choice) { this.choice = choice; }
    public String getTextAnswer() { return textAnswer; }
    public void setTextAnswer(String textAnswer) { this.textAnswer = textAnswer; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }
}
