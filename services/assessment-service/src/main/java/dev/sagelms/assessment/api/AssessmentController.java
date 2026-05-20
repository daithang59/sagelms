package dev.sagelms.assessment.api;

import dev.sagelms.assessment.dto.*;
import dev.sagelms.assessment.service.AssessmentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class AssessmentController {

    private static final String USER_ID_HEADER = "X-User-Id";
    private static final String USER_EMAIL_HEADER = "X-User-Email";
    private static final String ROLES_HEADER = "X-User-Roles";

    private final AssessmentService assessmentService;

    public AssessmentController(AssessmentService assessmentService) {
        this.assessmentService = assessmentService;
    }

    @GetMapping("/courses/{courseId}/assessments")
    public ResponseEntity<Page<AssessmentResponse>> listAssessments(
            @PathVariable UUID courseId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestHeader(value = USER_ID_HEADER, required = false) UUID userId,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(assessmentService.listCourseAssessments(courseId, search, category, userId, roles, pageable));
    }

    @PostMapping("/courses/{courseId}/assessments")
    public ResponseEntity<AssessmentResponse> createAssessment(
            @PathVariable UUID courseId,
            @Valid @RequestBody AssessmentRequest request,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assessmentService.createAssessment(courseId, request, userId, roles));
    }

    @GetMapping("/courses/{courseId}/assessments/{assessmentId}")
    public ResponseEntity<AssessmentDetailResponse> getAssessment(
            @PathVariable UUID assessmentId,
            @RequestHeader(value = USER_ID_HEADER, required = false) UUID userId,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles) {
        return ResponseEntity.ok(assessmentService.getAssessment(assessmentId, userId, roles));
    }

    @PutMapping("/courses/{courseId}/assessments/{assessmentId}")
    public ResponseEntity<AssessmentResponse> updateAssessment(
            @PathVariable UUID assessmentId,
            @Valid @RequestBody AssessmentRequest request,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.ok(assessmentService.updateAssessment(assessmentId, request, userId, roles));
    }

    @DeleteMapping("/courses/{courseId}/assessments/{assessmentId}")
    public ResponseEntity<Void> deleteAssessment(
            @PathVariable UUID assessmentId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        assessmentService.deleteAssessment(assessmentId, userId, roles);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/assessments/{assessmentId}/questions")
    public ResponseEntity<List<AssessmentQuestionResponse>> getQuestions(
            @PathVariable UUID assessmentId,
            @RequestHeader(value = USER_ID_HEADER, required = false) UUID userId,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles) {
        return ResponseEntity.ok(assessmentService.getQuestions(assessmentId, userId, roles));
    }

    @GetMapping("/assessments/{assessmentId}/question-sets")
    public ResponseEntity<List<AssessmentQuestionSetResponse>> getQuestionSets(
            @PathVariable UUID assessmentId,
            @RequestHeader(value = USER_ID_HEADER, required = false) UUID userId,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles) {
        return ResponseEntity.ok(assessmentService.getQuestionSets(assessmentId, userId, roles));
    }

    @PostMapping("/assessments/{assessmentId}/question-sets")
    public ResponseEntity<AssessmentQuestionSetResponse> createQuestionSet(
            @PathVariable UUID assessmentId,
            @Valid @RequestBody AssessmentQuestionSetRequest request,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assessmentService.createQuestionSet(assessmentId, request, userId, roles));
    }

    @GetMapping({"/assessments/{assessmentId}/question-sets/{questionSetId}", "/assessment-question-sets/{questionSetId}"})
    public ResponseEntity<AssessmentQuestionSetDetailResponse> getQuestionSet(
            @PathVariable UUID questionSetId,
            @RequestHeader(value = USER_ID_HEADER, required = false) UUID userId,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles) {
        return ResponseEntity.ok(assessmentService.getQuestionSet(questionSetId, userId, roles));
    }

    @PutMapping({"/assessments/{assessmentId}/question-sets/{questionSetId}", "/assessment-question-sets/{questionSetId}"})
    public ResponseEntity<AssessmentQuestionSetResponse> updateQuestionSet(
            @PathVariable UUID questionSetId,
            @Valid @RequestBody AssessmentQuestionSetRequest request,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.ok(assessmentService.updateQuestionSet(questionSetId, request, userId, roles));
    }

    @DeleteMapping({"/assessments/{assessmentId}/question-sets/{questionSetId}", "/assessment-question-sets/{questionSetId}"})
    public ResponseEntity<Void> deleteQuestionSet(
            @PathVariable UUID questionSetId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        assessmentService.deleteQuestionSet(questionSetId, userId, roles);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/assessments/{assessmentId}/questions")
    public ResponseEntity<AssessmentQuestionResponse> addQuestion(
            @PathVariable UUID assessmentId,
            @Valid @RequestBody AssessmentQuestionRequest request,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assessmentService.addQuestionToAssessment(assessmentId, request, userId, roles));
    }

    @PostMapping("/assessment-question-sets/{questionSetId}/questions")
    public ResponseEntity<AssessmentQuestionResponse> addQuestionToSet(
            @PathVariable UUID questionSetId,
            @Valid @RequestBody AssessmentQuestionRequest request,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assessmentService.addQuestion(questionSetId, request, userId, roles));
    }

    @PutMapping("/assessments/{assessmentId}/questions/{questionId}")
    public ResponseEntity<AssessmentQuestionResponse> updateQuestion(
            @PathVariable UUID questionId,
            @Valid @RequestBody AssessmentQuestionRequest request,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.ok(assessmentService.updateQuestion(questionId, request, userId, roles));
    }

    @DeleteMapping("/assessments/{assessmentId}/questions/{questionId}")
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable UUID questionId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        assessmentService.deleteQuestion(questionId, userId, roles);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/assessments/{assessmentId}/attempts")
    public ResponseEntity<StartAttemptResponse> startAttempt(
            @PathVariable UUID assessmentId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(value = USER_EMAIL_HEADER, required = false) String userEmail,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assessmentService.startAssessmentAttempt(assessmentId, userId, userEmail, roles));
    }

    @PostMapping("/assessment-question-sets/{questionSetId}/attempts")
    public ResponseEntity<StartAttemptResponse> startQuestionSetAttempt(
            @PathVariable UUID questionSetId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(value = USER_EMAIL_HEADER, required = false) String userEmail,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assessmentService.startAttempt(questionSetId, userId, userEmail, roles));
    }

    @PutMapping("/assessment-attempts/{attemptId}/submit")
    public ResponseEntity<AssessmentAttemptResultResponse> submitAttempt(
            @PathVariable UUID attemptId,
            @Valid @RequestBody SubmitAssessmentAttemptRequest request,
            @RequestHeader(USER_ID_HEADER) UUID userId) {
        return ResponseEntity.ok(assessmentService.submitAttempt(attemptId, request, userId));
    }

    @GetMapping("/assessment-attempts/{attemptId}/result")
    public ResponseEntity<AssessmentAttemptResultResponse> getAttemptResult(
            @PathVariable UUID attemptId,
            @RequestHeader(USER_ID_HEADER) UUID userId) {
        return ResponseEntity.ok(assessmentService.getAttemptResult(attemptId, userId));
    }

    @GetMapping("/assessments/{assessmentId}/submissions")
    public ResponseEntity<List<AssessmentSubmissionSummaryResponse>> getSubmissions(
            @PathVariable UUID assessmentId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.ok(assessmentService.getSubmissions(assessmentId, userId, roles));
    }

    @GetMapping("/assessments/{assessmentId}/my-submissions")
    public ResponseEntity<List<AssessmentSubmissionSummaryResponse>> getMyGradedSubmissions(
            @PathVariable UUID assessmentId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles) {
        return ResponseEntity.ok(assessmentService.getMyGradedSubmissions(assessmentId, userId, roles));
    }

    @GetMapping("/courses/{courseId}/assessment-submissions")
    public ResponseEntity<List<AssessmentSubmissionSummaryResponse>> getCourseSubmissions(
            @PathVariable UUID courseId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.ok(assessmentService.getCourseSubmissions(courseId, userId, roles));
    }

    @GetMapping("/courses/{courseId}/assessment-gradebook")
    public ResponseEntity<List<AssessmentGradebookEntryResponse>> getCourseGradebook(
            @PathVariable UUID courseId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.ok(assessmentService.getCourseGradebook(courseId, userId, roles));
    }

    @GetMapping("/courses/{courseId}/my-assessment-results")
    public ResponseEntity<List<AssessmentSubmissionSummaryResponse>> getMyCourseResults(
            @PathVariable UUID courseId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles) {
        return ResponseEntity.ok(assessmentService.getMyCourseResults(courseId, userId, roles));
    }

    @GetMapping("/assessments/{assessmentId}/leaderboard")
    public ResponseEntity<List<AssessmentLeaderboardEntryResponse>> getLeaderboard(
            @PathVariable UUID assessmentId,
            @RequestHeader(value = USER_ID_HEADER, required = false) UUID userId,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles) {
        return ResponseEntity.ok(assessmentService.getLeaderboard(assessmentId, userId, roles));
    }

    @GetMapping("/assessments/{assessmentId}/participants/{participantId}/submissions")
    public ResponseEntity<List<AssessmentSubmissionSummaryResponse>> getParticipantSubmissions(
            @PathVariable UUID assessmentId,
            @PathVariable UUID participantId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.ok(assessmentService.getParticipantSubmissions(assessmentId, participantId, userId, roles));
    }

    @GetMapping("/assessment-attempts/{attemptId}/review")
    public ResponseEntity<AssessmentAttemptResultResponse> getAttemptReview(
            @PathVariable UUID attemptId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.ok(assessmentService.getAttemptReview(attemptId, userId, roles));
    }

    @PutMapping("/assessment-attempts/{attemptId}/grade")
    public ResponseEntity<AssessmentAttemptResultResponse> gradeAttempt(
            @PathVariable UUID attemptId,
            @Valid @RequestBody GradeAssessmentAttemptRequest request,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.ok(assessmentService.gradeAttempt(attemptId, request, userId, roles));
    }

    @DeleteMapping("/assessment-attempts/{attemptId}")
    public ResponseEntity<Void> deleteAttempt(
            @PathVariable UUID attemptId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        assessmentService.deleteAttempt(attemptId, userId, roles);
        return ResponseEntity.noContent().build();
    }
}




