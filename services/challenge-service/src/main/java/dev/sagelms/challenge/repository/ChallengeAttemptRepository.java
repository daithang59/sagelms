package dev.sagelms.challenge.repository;

import dev.sagelms.challenge.entity.ChallengeAttempt;
import dev.sagelms.challenge.entity.GradingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChallengeAttemptRepository extends JpaRepository<ChallengeAttempt, UUID> {
    long countByChallengeIdAndParticipantId(UUID challengeId, UUID participantId);
    long countByQuestionSetIdAndParticipantId(UUID questionSetId, UUID participantId);
    long countByQuestionSetIdAndParticipantIdAndSubmittedAtIsNotNull(UUID questionSetId, UUID participantId);
    Optional<ChallengeAttempt> findFirstByQuestionSetIdAndParticipantIdAndSubmittedAtIsNullOrderByStartedAtDesc(UUID questionSetId, UUID participantId);
    Optional<ChallengeAttempt> findFirstByQuestionSetIdAndParticipantIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(UUID questionSetId, UUID participantId);
    List<ChallengeAttempt> findByQuestionSetIdAndSubmittedAtIsNotNull(UUID questionSetId);
    List<ChallengeAttempt> findByChallengeIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(UUID challengeId);
    List<ChallengeAttempt> findByChallengeIdAndParticipantIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(UUID challengeId, UUID participantId);
    List<ChallengeAttempt> findByChallengeIdAndGradingStatusOrderBySubmittedAtDesc(UUID challengeId, GradingStatus gradingStatus);
    List<ChallengeAttempt> findByChallengeIdAndGradingStatusAndSubmittedAtIsNotNullOrderBySubmittedAtAsc(UUID challengeId, GradingStatus gradingStatus);
}
