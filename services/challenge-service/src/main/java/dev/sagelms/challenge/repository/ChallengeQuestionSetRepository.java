package dev.sagelms.challenge.repository;

import dev.sagelms.challenge.entity.ChallengeQuestionSet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChallengeQuestionSetRepository extends JpaRepository<ChallengeQuestionSet, UUID> {
    List<ChallengeQuestionSet> findByChallengeIdOrderBySortOrderAsc(UUID challengeId);
    Optional<ChallengeQuestionSet> findFirstByChallengeIdOrderBySortOrderAsc(UUID challengeId);
    long countByChallengeId(UUID challengeId);
}
