package dev.sagelms.assessment.repository;

import dev.sagelms.assessment.entity.AssessmentChoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AssessmentChoiceRepository extends JpaRepository<AssessmentChoice, UUID> {
    List<AssessmentChoice> findByQuestionIdOrderBySortOrderAsc(UUID questionId);
    void deleteByQuestionId(UUID questionId);
}


