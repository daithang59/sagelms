package dev.sagelms.challenge.api;

import dev.sagelms.challenge.dto.*;
import dev.sagelms.challenge.service.ChallengeService;
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
public class ChallengeController {

    private static final String USER_ID_HEADER = "X-User-Id";
    private static final String USER_EMAIL_HEADER = "X-User-Email";
    private static final String ROLES_HEADER = "X-User-Roles";

    private final ChallengeService challengeService;

    public ChallengeController(ChallengeService challengeService) {
        this.challengeService = challengeService;
    }

    @GetMapping("/challenges")
    public ResponseEntity<Page<ChallengeResponse>> listChallenges(
            @RequestParam(required = false) String search,
            @RequestHeader(value = USER_ID_HEADER, required = false) UUID userId,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(challengeService.listChallenges(search, userId, roles, pageable));
    }

    @PostMapping("/challenges")
    public ResponseEntity<ChallengeResponse> createChallenge(
            @Valid @RequestBody ChallengeRequest request,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(challengeService.createChallenge(request, userId, roles));
    }

    @GetMapping("/challenges/{challengeId}")
    public ResponseEntity<ChallengeDetailResponse> getChallenge(
            @PathVariable UUID challengeId,
            @RequestHeader(value = USER_ID_HEADER, required = false) UUID userId,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles) {
        return ResponseEntity.ok(challengeService.getChallenge(challengeId, userId, roles));
    }

    @PutMapping("/challenges/{challengeId}")
    public ResponseEntity<ChallengeResponse> updateChallenge(
            @PathVariable UUID challengeId,
            @Valid @RequestBody ChallengeRequest request,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.ok(challengeService.updateChallenge(challengeId, request, userId, roles));
    }

    @DeleteMapping("/challenges/{challengeId}")
    public ResponseEntity<Void> deleteChallenge(
            @PathVariable UUID challengeId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        challengeService.deleteChallenge(challengeId, userId, roles);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/challenges/{challengeId}/questions")
    public ResponseEntity<List<ChallengeQuestionResponse>> getQuestions(
            @PathVariable UUID challengeId,
            @RequestHeader(value = USER_ID_HEADER, required = false) UUID userId,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles) {
        return ResponseEntity.ok(challengeService.getQuestions(challengeId, userId, roles));
    }

    @GetMapping("/challenges/{challengeId}/question-sets")
    public ResponseEntity<List<ChallengeQuestionSetResponse>> getQuestionSets(
            @PathVariable UUID challengeId,
            @RequestHeader(value = USER_ID_HEADER, required = false) UUID userId,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles) {
        return ResponseEntity.ok(challengeService.getQuestionSets(challengeId, userId, roles));
    }

    @PostMapping("/challenges/{challengeId}/question-sets")
    public ResponseEntity<ChallengeQuestionSetResponse> createQuestionSet(
            @PathVariable UUID challengeId,
            @Valid @RequestBody ChallengeQuestionSetRequest request,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(challengeService.createQuestionSet(challengeId, request, userId, roles));
    }

    @GetMapping("/challenges/{challengeId}/question-sets/{questionSetId}")
    public ResponseEntity<ChallengeQuestionSetDetailResponse> getQuestionSet(
            @PathVariable UUID questionSetId,
            @RequestHeader(value = USER_ID_HEADER, required = false) UUID userId,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles) {
        return ResponseEntity.ok(challengeService.getQuestionSet(questionSetId, userId, roles));
    }

    @PutMapping("/challenges/{challengeId}/question-sets/{questionSetId}")
    public ResponseEntity<ChallengeQuestionSetResponse> updateQuestionSet(
            @PathVariable UUID questionSetId,
            @Valid @RequestBody ChallengeQuestionSetRequest request,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.ok(challengeService.updateQuestionSet(questionSetId, request, userId, roles));
    }

    @DeleteMapping("/challenges/{challengeId}/question-sets/{questionSetId}")
    public ResponseEntity<Void> deleteQuestionSet(
            @PathVariable UUID questionSetId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        challengeService.deleteQuestionSet(questionSetId, userId, roles);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/challenges/{challengeId}/questions")
    public ResponseEntity<ChallengeQuestionResponse> addQuestion(
            @PathVariable UUID challengeId,
            @Valid @RequestBody ChallengeQuestionRequest request,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(challengeService.addQuestionToChallenge(challengeId, request, userId, roles));
    }

    @PostMapping("/question-sets/{questionSetId}/questions")
    public ResponseEntity<ChallengeQuestionResponse> addQuestionToSet(
            @PathVariable UUID questionSetId,
            @Valid @RequestBody ChallengeQuestionRequest request,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(challengeService.addQuestion(questionSetId, request, userId, roles));
    }

    @PutMapping("/challenges/{challengeId}/questions/{questionId}")
    public ResponseEntity<ChallengeQuestionResponse> updateQuestion(
            @PathVariable UUID questionId,
            @Valid @RequestBody ChallengeQuestionRequest request,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.ok(challengeService.updateQuestion(questionId, request, userId, roles));
    }

    @DeleteMapping("/challenges/{challengeId}/questions/{questionId}")
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable UUID questionId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        challengeService.deleteQuestion(questionId, userId, roles);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/challenges/{challengeId}/attempts")
    public ResponseEntity<StartAttemptResponse> startAttempt(
            @PathVariable UUID challengeId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(value = USER_EMAIL_HEADER, required = false) String userEmail,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(challengeService.startChallengeAttempt(challengeId, userId, userEmail, roles));
    }

    @PostMapping("/question-sets/{questionSetId}/attempts")
    public ResponseEntity<StartAttemptResponse> startQuestionSetAttempt(
            @PathVariable UUID questionSetId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(value = USER_EMAIL_HEADER, required = false) String userEmail,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(challengeService.startAttempt(questionSetId, userId, userEmail, roles));
    }

    @PutMapping("/challenge-attempts/{attemptId}/submit")
    public ResponseEntity<ChallengeAttemptResultResponse> submitAttempt(
            @PathVariable UUID attemptId,
            @Valid @RequestBody SubmitChallengeAttemptRequest request,
            @RequestHeader(USER_ID_HEADER) UUID userId) {
        return ResponseEntity.ok(challengeService.submitAttempt(attemptId, request, userId));
    }

    @GetMapping("/challenge-attempts/{attemptId}/result")
    public ResponseEntity<ChallengeAttemptResultResponse> getAttemptResult(
            @PathVariable UUID attemptId,
            @RequestHeader(USER_ID_HEADER) UUID userId) {
        return ResponseEntity.ok(challengeService.getAttemptResult(attemptId, userId));
    }

    @GetMapping("/challenges/{challengeId}/submissions")
    public ResponseEntity<List<ChallengeSubmissionSummaryResponse>> getSubmissions(
            @PathVariable UUID challengeId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.ok(challengeService.getSubmissions(challengeId, userId, roles));
    }

    @GetMapping("/challenges/{challengeId}/leaderboard")
    public ResponseEntity<List<ChallengeLeaderboardEntryResponse>> getLeaderboard(
            @PathVariable UUID challengeId,
            @RequestHeader(value = USER_ID_HEADER, required = false) UUID userId,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles) {
        return ResponseEntity.ok(challengeService.getLeaderboard(challengeId, userId, roles));
    }

    @GetMapping("/challenges/{challengeId}/participants/{participantId}/submissions")
    public ResponseEntity<List<ChallengeSubmissionSummaryResponse>> getParticipantSubmissions(
            @PathVariable UUID challengeId,
            @PathVariable UUID participantId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.ok(challengeService.getParticipantSubmissions(challengeId, participantId, userId, roles));
    }

    @GetMapping("/challenge-attempts/{attemptId}/review")
    public ResponseEntity<ChallengeAttemptResultResponse> getAttemptReview(
            @PathVariable UUID attemptId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.ok(challengeService.getAttemptReview(attemptId, userId, roles));
    }

    @PutMapping("/challenge-attempts/{attemptId}/grade")
    public ResponseEntity<ChallengeAttemptResultResponse> gradeAttempt(
            @PathVariable UUID attemptId,
            @Valid @RequestBody GradeChallengeAttemptRequest request,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        return ResponseEntity.ok(challengeService.gradeAttempt(attemptId, request, userId, roles));
    }

    @DeleteMapping("/challenge-attempts/{attemptId}")
    public ResponseEntity<Void> deleteAttempt(
            @PathVariable UUID attemptId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles) {
        challengeService.deleteAttempt(attemptId, userId, roles);
        return ResponseEntity.noContent().build();
    }
}
