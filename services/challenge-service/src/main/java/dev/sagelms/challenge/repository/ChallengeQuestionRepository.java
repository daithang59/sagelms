package dev.sagelms.challenge.repository;

import dev.sagelms.challenge.entity.ChallengeQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChallengeQuestionRepository extends JpaRepository<ChallengeQuestion, UUID> {
    List<ChallengeQuestion> findByChallengeIdOrderBySortOrderAsc(UUID challengeId);
    List<ChallengeQuestion> findByQuestionSetIdOrderBySortOrderAsc(UUID questionSetId);
    long countByChallengeId(UUID challengeId);
    long countByQuestionSetId(UUID questionSetId);
}
