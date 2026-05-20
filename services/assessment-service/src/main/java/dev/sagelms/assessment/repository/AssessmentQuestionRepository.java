package dev.sagelms.assessment.repository;

import dev.sagelms.assessment.entity.AssessmentQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AssessmentQuestionRepository extends JpaRepository<AssessmentQuestion, UUID> {
    List<AssessmentQuestion> findByAssessmentIdOrderBySortOrderAsc(UUID AssessmentId);
    List<AssessmentQuestion> findByQuestionSetIdOrderBySortOrderAsc(UUID questionSetId);
    long countByAssessmentId(UUID AssessmentId);
    long countByQuestionSetId(UUID questionSetId);
}


