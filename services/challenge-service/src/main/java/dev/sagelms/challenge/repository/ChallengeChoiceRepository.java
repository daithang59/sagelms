package dev.sagelms.challenge.repository;

import dev.sagelms.challenge.entity.ChallengeChoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChallengeChoiceRepository extends JpaRepository<ChallengeChoice, UUID> {
    List<ChallengeChoice> findByQuestionIdOrderBySortOrderAsc(UUID questionId);
    void deleteByQuestionId(UUID questionId);
}
