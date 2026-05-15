package dev.sagelms.challenge.repository;

import dev.sagelms.challenge.entity.ChallengeAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChallengeAnswerRepository extends JpaRepository<ChallengeAnswer, UUID> {
    List<ChallengeAnswer> findByAttemptId(UUID attemptId);
}
