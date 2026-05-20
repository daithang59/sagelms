package dev.sagelms.assessment.repository;

import dev.sagelms.assessment.entity.AssessmentAttempt;
import dev.sagelms.assessment.entity.GradingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttempt, UUID> {
    long countByAssessmentIdAndParticipantId(UUID AssessmentId, UUID participantId);
    long countByQuestionSetIdAndParticipantId(UUID questionSetId, UUID participantId);
    long countByQuestionSetIdAndParticipantIdAndSubmittedAtIsNotNull(UUID questionSetId, UUID participantId);
    Optional<AssessmentAttempt> findFirstByQuestionSetIdAndParticipantIdAndSubmittedAtIsNullOrderByStartedAtDesc(UUID questionSetId, UUID participantId);
    Optional<AssessmentAttempt> findFirstByQuestionSetIdAndParticipantIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(UUID questionSetId, UUID participantId);
    List<AssessmentAttempt> findByQuestionSetIdAndSubmittedAtIsNotNull(UUID questionSetId);
    List<AssessmentAttempt> findByAssessmentIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(UUID AssessmentId);
    List<AssessmentAttempt> findByAssessmentIdAndParticipantIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(UUID AssessmentId, UUID participantId);
    List<AssessmentAttempt> findByAssessmentCourseIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(UUID courseId);
    List<AssessmentAttempt> findByAssessmentCourseIdAndParticipantIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(UUID courseId, UUID participantId);
    List<AssessmentAttempt> findByAssessmentIdAndGradingStatusOrderBySubmittedAtDesc(UUID AssessmentId, GradingStatus gradingStatus);
    List<AssessmentAttempt> findByAssessmentIdAndGradingStatusAndSubmittedAtIsNotNullOrderBySubmittedAtAsc(UUID AssessmentId, GradingStatus gradingStatus);
}


