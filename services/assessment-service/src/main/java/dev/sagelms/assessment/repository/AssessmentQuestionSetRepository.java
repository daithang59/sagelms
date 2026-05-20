package dev.sagelms.assessment.repository;

import dev.sagelms.assessment.entity.AssessmentQuestionSet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssessmentQuestionSetRepository extends JpaRepository<AssessmentQuestionSet, UUID> {
    List<AssessmentQuestionSet> findByAssessmentIdOrderBySortOrderAsc(UUID AssessmentId);
    Optional<AssessmentQuestionSet> findFirstByAssessmentIdOrderBySortOrderAsc(UUID AssessmentId);
    long countByAssessmentId(UUID AssessmentId);
}


