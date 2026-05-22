package dev.sagelms.assessment.api;

import dev.sagelms.assessment.dto.AssessmentQuestionResponse;
import dev.sagelms.assessment.dto.AssessmentQuestionSetDetailResponse;
import dev.sagelms.assessment.dto.AssessmentQuestionSetResponse;
import dev.sagelms.assessment.dto.AssessmentResponse;
import dev.sagelms.assessment.service.AssessmentService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/internal/courses")
public class InternalAssessmentContextController {

    private static final String INTERNAL_SECRET_HEADER = "X-Internal-Secret";

    private final AssessmentService assessmentService;
    private final String internalSecret;

    public InternalAssessmentContextController(
            AssessmentService assessmentService,
            @Value("${app.internal.secret:sagelms-dev-internal-secret}") String internalSecret) {
        this.assessmentService = assessmentService;
        this.internalSecret = internalSecret;
    }

    @GetMapping("/{courseId}/ai-context/assessments")
    public ResponseEntity<List<AssessmentAiContextResponse>> getAssessmentsForAiContext(
            @PathVariable UUID courseId,
            @RequestParam UUID userId,
            @RequestParam(required = false) String roles,
            @RequestHeader(value = INTERNAL_SECRET_HEADER, required = false) String providedSecret) {
        if (!internalSecret.equals(providedSecret)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<AssessmentResponse> assessments = assessmentService
                .listCourseAssessments(courseId, null, null, userId, roles, PageRequest.of(0, 100))
                .getContent();

        List<AssessmentAiContextResponse> body = assessments.stream()
                .map(assessment -> new AssessmentAiContextResponse(
                        assessment,
                        assessmentService.getQuestionSets(assessment.id(), userId, roles).stream()
                                .map(questionSet -> getQuestionSetDetail(questionSet, userId, roles))
                                .toList()))
                .toList();

        return ResponseEntity.ok(body);
    }

    private AssessmentQuestionSetAiContextResponse getQuestionSetDetail(
            AssessmentQuestionSetResponse questionSet,
            UUID userId,
            String roles) {
        AssessmentQuestionSetDetailResponse detail = assessmentService.getQuestionSet(questionSet.id(), userId, roles);
        return new AssessmentQuestionSetAiContextResponse(detail.questionSet(), detail.questions());
    }

    public record AssessmentAiContextResponse(
            AssessmentResponse assessment,
            List<AssessmentQuestionSetAiContextResponse> questionSets
    ) {}

    public record AssessmentQuestionSetAiContextResponse(
            AssessmentQuestionSetResponse questionSet,
            List<AssessmentQuestionResponse> questions
    ) {}
}
