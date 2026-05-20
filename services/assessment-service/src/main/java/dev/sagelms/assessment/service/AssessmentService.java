package dev.sagelms.assessment.service;

import dev.sagelms.assessment.dto.*;
import dev.sagelms.assessment.entity.*;
import dev.sagelms.assessment.repository.*;
import dev.sagelms.assessment.security.RoleUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class AssessmentService {

    private final AssessmentRepository assessmentRepository;
    private final AssessmentQuestionSetRepository questionSetRepository;
    private final AssessmentQuestionRepository questionRepository;
    private final AssessmentChoiceRepository choiceRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final AssessmentAnswerRepository answerRepository;
    private final CourseAccessClient courseAccessClient;

    public AssessmentService(
            AssessmentRepository assessmentRepository,
            AssessmentQuestionSetRepository questionSetRepository,
            AssessmentQuestionRepository questionRepository,
            AssessmentChoiceRepository choiceRepository,
            AssessmentAttemptRepository attemptRepository,
            AssessmentAnswerRepository answerRepository,
            CourseAccessClient courseAccessClient) {
        this.assessmentRepository = assessmentRepository;
        this.questionSetRepository = questionSetRepository;
        this.questionRepository = questionRepository;
        this.choiceRepository = choiceRepository;
        this.attemptRepository = attemptRepository;
        this.answerRepository = answerRepository;
        this.courseAccessClient = courseAccessClient;
    }

    @Transactional(readOnly = true)
    public Page<AssessmentResponse> listCourseAssessments(UUID courseId, String search, String category, UUID viewerId, String roles, Pageable pageable) {
        String normalizedSearch = search != null && !search.isBlank() ? search.trim().toLowerCase(Locale.ROOT) : null;
        String normalizedCategory = category != null && !category.isBlank() ? category.trim().toLowerCase(Locale.ROOT) : null;
        Page<Assessment> Assessments;
        if (RoleUtils.isAdmin(roles) || courseAccessClient.isCourseOwner(courseId, viewerId)) {
            Assessments = assessmentRepository.findAllFiltered(courseId, normalizedSearch, normalizedCategory, pageable);
        } else {
            requireCourseContentAccess(courseId, viewerId, roles);
            Assessments = assessmentRepository.findPublishedFiltered(courseId, normalizedSearch, normalizedCategory, pageable);
        }
        return Assessments.map(this::toResponse);
    }

    public AssessmentResponse createAssessment(UUID courseId, AssessmentRequest request, UUID instructorId, String roles) {
        requireInstructorOrAdmin(roles);
        if (instructorId == null) {
            throw new ForbiddenException("Missing user context.");
        }
        requireCourseManager(courseId, instructorId, roles);
        Assessment Assessment = new Assessment();
        applyAssessmentRequest(Assessment, request);
        Assessment.setCourseId(courseId);
        Assessment.setInstructorId(instructorId);
        Assessment saved = assessmentRepository.save(Assessment);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public AssessmentDetailResponse getAssessment(UUID AssessmentId, UUID viewerId, String roles) {
        Assessment Assessment = findAssessment(AssessmentId);
        requireCanView(Assessment, viewerId, roles);
        boolean manager = canManage(Assessment, viewerId, roles);
        return new AssessmentDetailResponse(
                toResponse(Assessment),
                getQuestions(AssessmentId, manager),
                getQuestionSets(AssessmentId, viewerId, roles));
    }

    public AssessmentResponse updateAssessment(UUID AssessmentId, AssessmentRequest request, UUID userId, String roles) {
        Assessment Assessment = findAssessment(AssessmentId);
        requireCanManage(Assessment, userId, roles);
        applyAssessmentRequest(Assessment, request);
        return toResponse(assessmentRepository.save(Assessment));
    }

    public void deleteAssessment(UUID AssessmentId, UUID userId, String roles) {
        Assessment Assessment = findAssessment(AssessmentId);
        requireCanManage(Assessment, userId, roles);
        assessmentRepository.delete(Assessment);
    }

    @Transactional(readOnly = true)
    public List<AssessmentQuestionSetResponse> getQuestionSets(UUID AssessmentId, UUID viewerId, String roles) {
        Assessment Assessment = findAssessment(AssessmentId);
        requireCanView(Assessment, viewerId, roles);
        return questionSetRepository.findByAssessmentIdOrderBySortOrderAsc(AssessmentId).stream()
                .map(questionSet -> toQuestionSetResponse(questionSet, viewerId))
                .toList();
    }

    @Transactional(readOnly = true)
    public AssessmentQuestionSetDetailResponse getQuestionSet(UUID questionSetId, UUID viewerId, String roles) {
        AssessmentQuestionSet questionSet = findQuestionSet(questionSetId);
        requireCanView(questionSet.getAssessment(), viewerId, roles);
        boolean revealCorrect = canManage(questionSet.getAssessment(), viewerId, roles);
        return new AssessmentQuestionSetDetailResponse(
                toQuestionSetResponse(questionSet, viewerId),
                getQuestionSetQuestions(questionSetId, revealCorrect));
    }

    public AssessmentQuestionSetResponse createQuestionSet(
            UUID AssessmentId,
            AssessmentQuestionSetRequest request,
            UUID userId,
            String roles) {
        Assessment Assessment = findAssessment(AssessmentId);
        requireCanManage(Assessment, userId, roles);
        AssessmentQuestionSet questionSet = new AssessmentQuestionSet();
        questionSet.setAssessment(Assessment);
        applyQuestionSetRequest(questionSet, request);
        AssessmentQuestionSet saved = questionSetRepository.save(questionSet);
        return toQuestionSetResponse(saved, userId);
    }

    public AssessmentQuestionSetResponse updateQuestionSet(
            UUID questionSetId,
            AssessmentQuestionSetRequest request,
            UUID userId,
            String roles) {
        AssessmentQuestionSet questionSet = findQuestionSet(questionSetId);
        requireCanManage(questionSet.getAssessment(), userId, roles);
        deleteSubmittedAttemptsForQuestionSet(questionSetId);
        applyQuestionSetRequest(questionSet, request);
        return toQuestionSetResponse(questionSetRepository.save(questionSet), userId);
    }

    public void deleteQuestionSet(UUID questionSetId, UUID userId, String roles) {
        AssessmentQuestionSet questionSet = findQuestionSet(questionSetId);
        requireCanManage(questionSet.getAssessment(), userId, roles);
        deleteSubmittedAttemptsForQuestionSet(questionSetId);
        questionSetRepository.delete(questionSet);
    }

    @Transactional(readOnly = true)
    public List<AssessmentQuestionResponse> getQuestions(UUID AssessmentId, UUID viewerId, String roles) {
        Assessment Assessment = findAssessment(AssessmentId);
        requireCanView(Assessment, viewerId, roles);
        return getQuestions(AssessmentId, canManage(Assessment, viewerId, roles));
    }

    public AssessmentQuestionResponse addQuestion(UUID questionSetId, AssessmentQuestionRequest request, UUID userId, String roles) {
        AssessmentQuestionSet questionSet = findQuestionSet(questionSetId);
        requireCanManage(questionSet.getAssessment(), userId, roles);
        deleteSubmittedAttemptsForQuestionSet(questionSet.getId());
        AssessmentQuestion question = new AssessmentQuestion();
        question.setAssessment(questionSet.getAssessment());
        question.setQuestionSet(questionSet);
        applyQuestionRequest(question, request);
        AssessmentQuestion saved = questionRepository.save(question);
        saveChoices(saved, request);
        return toQuestionResponse(saved, true);
    }

    public AssessmentQuestionResponse addQuestionToAssessment(UUID AssessmentId, AssessmentQuestionRequest request, UUID userId, String roles) {
        Assessment Assessment = findAssessment(AssessmentId);
        requireCanManage(Assessment, userId, roles);
        AssessmentQuestionSet questionSet = getOrCreateDefaultQuestionSet(Assessment);
        return addQuestion(questionSet.getId(), request, userId, roles);
    }

    public AssessmentQuestionResponse updateQuestion(UUID questionId, AssessmentQuestionRequest request, UUID userId, String roles) {
        AssessmentQuestion question = findQuestion(questionId);
        requireCanManage(question.getAssessment(), userId, roles);
        UUID questionSetId = question.getQuestionSet() != null ? question.getQuestionSet().getId() : null;
        if (questionSetId != null) {
            deleteSubmittedAttemptsForQuestionSet(questionSetId);
        }
        applyQuestionRequest(question, request);
        AssessmentQuestion saved = questionRepository.save(question);
        syncChoices(saved, request);
        return toQuestionResponse(saved, true);
    }

    public void deleteQuestion(UUID questionId, UUID userId, String roles) {
        AssessmentQuestion question = findQuestion(questionId);
        requireCanManage(question.getAssessment(), userId, roles);
        if (question.getQuestionSet() != null) {
            deleteSubmittedAttemptsForQuestionSet(question.getQuestionSet().getId());
        }
        questionRepository.delete(question);
    }

    public StartAttemptResponse startAttempt(UUID questionSetId, UUID participantId, String participantEmail, String roles) {
        if (participantId == null) {
            throw new ForbiddenException("Login required to join this Assessment.");
        }
        AssessmentQuestionSet questionSet = findQuestionSet(questionSetId);
        Assessment Assessment = questionSet.getAssessment();
        if (Assessment.getStatus() != AssessmentStatus.PUBLISHED && !canManage(Assessment, participantId, roles)) {
            throw new ForbiddenException("Assessment is not open for participation.");
        }
        if (Assessment.getStatus() == AssessmentStatus.PUBLISHED && !canManage(Assessment, participantId, roles)) {
            requireCourseContentAccess(Assessment.getCourseId(), participantId, roles);
        }
        long submittedAttempts = attemptRepository.countByQuestionSetIdAndParticipantIdAndSubmittedAtIsNotNull(
                questionSetId,
                participantId);
        int maxAttempts = normalizedMaxAttempts(questionSet);
        if (submittedAttempts >= maxAttempts) {
            throw new ValidationException("You have already submitted this Assessment attempt.");
        }

        Optional<AssessmentAttempt> existingAttempt = attemptRepository
                .findFirstByQuestionSetIdAndParticipantIdAndSubmittedAtIsNullOrderByStartedAtDesc(questionSetId, participantId);
        if (existingAttempt.isPresent()) {
            AssessmentAttempt attempt = existingAttempt.get();
            return new StartAttemptResponse(
                    attempt.getId(),
                    Assessment.getId(),
                    questionSet.getId(),
                    participantId,
                    attempt.getStartedAt(),
                    questionSet.getTimeLimitMinutes(),
                    getQuestionSetQuestions(questionSetId, false));
        }

        AssessmentAttempt attempt = new AssessmentAttempt();
        attempt.setAssessment(Assessment);
        attempt.setQuestionSet(questionSet);
        attempt.setParticipantId(participantId);
        attempt.setParticipantEmail(participantEmail);
        attempt.setGradingStatus(GradingStatus.IN_PROGRESS);
        AssessmentAttempt saved = attemptRepository.save(attempt);
        return new StartAttemptResponse(
                saved.getId(),
                Assessment.getId(),
                questionSet.getId(),
                participantId,
                saved.getStartedAt(),
                questionSet.getTimeLimitMinutes(),
                getQuestionSetQuestions(questionSetId, false));
    }

    public StartAttemptResponse startAssessmentAttempt(UUID AssessmentId, UUID participantId, String participantEmail, String roles) {
        Assessment Assessment = findAssessment(AssessmentId);
        AssessmentQuestionSet questionSet = getOrCreateDefaultQuestionSet(Assessment);
        return startAttempt(questionSet.getId(), participantId, participantEmail, roles);
    }

    public AssessmentAttemptResultResponse submitAttempt(
            UUID attemptId,
            SubmitAssessmentAttemptRequest request,
            UUID participantId) {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new NotFoundException("Attempt not found: " + attemptId));
        if (!attempt.getParticipantId().equals(participantId)) {
            throw new ForbiddenException("You can only submit your own attempt.");
        }
        if (attempt.getSubmittedAt() != null) {
            throw new ValidationException("Attempt already submitted.");
        }
        ensureAttemptWithinTimeLimit(attempt);

        Map<UUID, SubmitAssessmentAnswerRequest> submitted = new HashMap<>();
        for (SubmitAssessmentAnswerRequest answer : Optional.ofNullable(request.answers()).orElse(List.of())) {
            if (answer.questionId() != null) {
                submitted.put(answer.questionId(), answer);
            }
        }

        List<AssessmentQuestion> questions = questionRepository.findByQuestionSetIdOrderBySortOrderAsc(
                attempt.getQuestionSet().getId());
        for (AssessmentQuestion question : questions) {
            SubmitAssessmentAnswerRequest submittedAnswer = submitted.get(question.getId());
            AssessmentAnswer answer = new AssessmentAnswer();
            answer.setAttempt(attempt);
            answer.setQuestion(question);

            if (question.getType() == AssessmentQuestionType.MULTIPLE_CHOICE) {
                AssessmentChoice selected = null;
                if (submittedAnswer != null && submittedAnswer.choiceId() != null) {
                    selected = choiceRepository.findById(submittedAnswer.choiceId())
                            .filter(choice -> choice.getQuestion().getId().equals(question.getId()))
                            .orElseThrow(() -> new ValidationException("Invalid choice for question: " + question.getId()));
                }
                answer.setChoice(selected);
                answer.setIsCorrect(selected != null && Boolean.TRUE.equals(selected.getIsCorrect()));
            } else {
                answer.setTextAnswer(submittedAnswer != null ? submittedAnswer.textAnswer() : null);
                answer.setFileName(submittedAnswer != null ? submittedAnswer.fileName() : null);
                answer.setFileType(submittedAnswer != null ? submittedAnswer.fileType() : null);
                answer.setFileSize(submittedAnswer != null ? submittedAnswer.fileSize() : null);
                answer.setFileUrl(submittedAnswer != null ? submittedAnswer.fileUrl() : null);
                answer.setIsCorrect(null);
            }
            answerRepository.save(answer);
        }

        attempt.setScore(null);
        attempt.setMaxScore(BigDecimal.TEN);
        attempt.setPassed(null);
        Instant submittedAt = Instant.now();
        attempt.setSubmittedAt(submittedAt);
        attempt.setUsedSeconds(calculateUsedSeconds(attempt.getStartedAt(), submittedAt));
        attempt.setGradingStatus(GradingStatus.PENDING_REVIEW);
        attemptRepository.save(attempt);
        return toAttemptResult(attempt, answerRepository.findByAttemptId(attemptId), false);
    }

    @Transactional(readOnly = true)
    public AssessmentAttemptResultResponse getAttemptResult(UUID attemptId, UUID participantId) {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new NotFoundException("Attempt not found: " + attemptId));
        if (!attempt.getParticipantId().equals(participantId)) {
            throw new ForbiddenException("You can only view your own attempt result.");
        }
        return toAttemptResult(attempt, answerRepository.findByAttemptId(attemptId), attempt.getGradingStatus() == GradingStatus.GRADED);
    }

    @Transactional(readOnly = true)
    public List<AssessmentSubmissionSummaryResponse> getSubmissions(UUID AssessmentId, UUID userId, String roles) {
        Assessment Assessment = findAssessment(AssessmentId);
        requireCanManage(Assessment, userId, roles);
        return attemptRepository.findByAssessmentIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(AssessmentId).stream()
                .map(this::toSubmissionSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AssessmentSubmissionSummaryResponse> getCourseSubmissions(UUID courseId, UUID userId, String roles) {
        requireCourseManager(courseId, userId, roles);
        return attemptRepository.findByAssessmentCourseIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(courseId).stream()
                .map(this::toSubmissionSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AssessmentSubmissionSummaryResponse> getMyCourseResults(UUID courseId, UUID participantId, String roles) {
        requireCourseContentAccess(courseId, participantId, roles);
        return attemptRepository.findByAssessmentCourseIdAndParticipantIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(courseId, participantId).stream()
                .filter(attempt -> attempt.getGradingStatus() == GradingStatus.GRADED)
                .map(this::toSubmissionSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AssessmentGradebookEntryResponse> getCourseGradebook(UUID courseId, UUID userId, String roles) {
        requireCourseManager(courseId, userId, roles);
        Map<UUID, List<AssessmentAttempt>> byParticipant = attemptRepository
                .findByAssessmentCourseIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(courseId)
                .stream()
                .collect(Collectors.groupingBy(AssessmentAttempt::getParticipantId));
        return byParticipant.entrySet().stream()
                .map(entry -> toGradebookEntry(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(entry -> Optional.ofNullable(entry.participantEmail()).orElse("")))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AssessmentSubmissionSummaryResponse> getMyGradedSubmissions(UUID AssessmentId, UUID participantId, String roles) {
        if (participantId == null) {
            throw new ForbiddenException("Login required to view Assessment results.");
        }
        Assessment Assessment = findAssessment(AssessmentId);
        requireCanView(Assessment, participantId, roles);
        return attemptRepository.findByAssessmentIdAndParticipantIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(AssessmentId, participantId).stream()
                .filter(attempt -> attempt.getGradingStatus() == GradingStatus.GRADED)
                .map(this::toSubmissionSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AssessmentSubmissionSummaryResponse> getParticipantSubmissions(UUID AssessmentId, UUID participantId, UUID userId, String roles) {
        Assessment Assessment = findAssessment(AssessmentId);
        requireCanManage(Assessment, userId, roles);
        return attemptRepository.findByAssessmentIdAndParticipantIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(AssessmentId, participantId).stream()
                .map(this::toSubmissionSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AssessmentLeaderboardEntryResponse> getLeaderboard(UUID AssessmentId, UUID viewerId, String roles) {
        Assessment Assessment = findAssessment(AssessmentId);
        requireCanView(Assessment, viewerId, roles);

        List<AssessmentQuestionSet> visibleSets = visibleQuestionSets(AssessmentId);
        Set<UUID> visibleSetIds = visibleSets.stream()
                .map(AssessmentQuestionSet::getId)
                .collect(Collectors.toSet());
        long totalQuestionSets = visibleSets.size();

        Map<UUID, LeaderboardParticipant> participants = new HashMap<>();
        for (AssessmentAttempt attempt : attemptRepository
                .findByAssessmentIdAndGradingStatusAndSubmittedAtIsNotNullOrderBySubmittedAtAsc(AssessmentId, GradingStatus.GRADED)) {
            if (attempt.getQuestionSet() == null || !visibleSetIds.contains(attempt.getQuestionSet().getId())) {
                continue;
            }

            LeaderboardSetScore setScore = toLeaderboardSetScore(attempt);
            LeaderboardParticipant participant = participants.computeIfAbsent(
                    attempt.getParticipantId(),
                    id -> new LeaderboardParticipant(id, attempt.getParticipantEmail()));
            participant.keepBestAttempt(attempt.getQuestionSet().getId(), setScore);
        }

        List<LeaderboardParticipantScore> scores = participants.values().stream()
                .map(participant -> participant.toScore(totalQuestionSets))
                .filter(score -> score.completedQuestionSets() > 0)
                .sorted(Comparator
                        .comparing(LeaderboardParticipantScore::rankingScore).reversed()
                        .thenComparing(LeaderboardParticipantScore::firstStartedAt)
                        .thenComparing(score -> Optional.ofNullable(score.participantEmail()).orElse(""))
                        .thenComparing(score -> score.participantId().toString()))
                .toList();

        List<AssessmentLeaderboardEntryResponse> leaderboard = new ArrayList<>();
        for (int index = 0; index < scores.size(); index++) {
            LeaderboardParticipantScore score = scores.get(index);
            leaderboard.add(new AssessmentLeaderboardEntryResponse(
                    index + 1,
                    score.participantId(),
                    score.participantEmail(),
                    score.completedQuestionSets(),
                    score.totalQuestionSets(),
                    score.totalUsedSeconds(),
                    score.totalLimitSeconds(),
                    score.accuracyPercent(),
                    score.rankingScore(),
                    score.firstStartedAt()));
        }
        return leaderboard;
    }

    @Transactional(readOnly = true)
    public AssessmentAttemptResultResponse getAttemptReview(UUID attemptId, UUID userId, String roles) {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new NotFoundException("Attempt not found: " + attemptId));
        requireCanManage(attempt.getAssessment(), userId, roles);
        return toAttemptResult(attempt, answerRepository.findByAttemptId(attemptId), true);
    }

    public AssessmentAttemptResultResponse gradeAttempt(
            UUID attemptId,
            GradeAssessmentAttemptRequest request,
            UUID graderId,
            String roles) {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new NotFoundException("Attempt not found: " + attemptId));
        requireCanManage(attempt.getAssessment(), graderId, roles);
        if (attempt.getSubmittedAt() == null) {
            throw new ValidationException("Attempt has not been submitted.");
        }

        Map<UUID, Boolean> grades = Optional.ofNullable(request.answers()).orElse(List.of()).stream()
                .collect(Collectors.toMap(GradeAssessmentAnswerRequest::questionId, GradeAssessmentAnswerRequest::isCorrect));
        List<AssessmentAnswer> answers = answerRepository.findByAttemptId(attemptId);
        BigDecimal earnedPoints = BigDecimal.ZERO;
        BigDecimal totalPoints = BigDecimal.ZERO;
        for (AssessmentAnswer answer : answers) {
            Boolean isCorrect = grades.get(answer.getQuestion().getId());
            if (isCorrect != null) {
                answer.setIsCorrect(isCorrect);
            }
            BigDecimal questionPoints = nullToOne(answer.getQuestion().getPoints());
            totalPoints = totalPoints.add(questionPoints);
            if (Boolean.TRUE.equals(answer.getIsCorrect())) {
                earnedPoints = earnedPoints.add(questionPoints);
            }
            answerRepository.save(answer);
        }

        BigDecimal maxScore = BigDecimal.TEN;
        BigDecimal finalScore = totalPoints.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : earnedPoints.multiply(BigDecimal.TEN).divide(totalPoints, 2, RoundingMode.HALF_UP);
        attempt.setScore(finalScore);
        attempt.setMaxScore(maxScore);
        attempt.setPassed(null);
        attempt.setGradingStatus(GradingStatus.GRADED);
        attempt.setGradedAt(Instant.now());
        attempt.setGradedBy(graderId);
        attemptRepository.save(attempt);
        return toAttemptResult(attempt, answers, true);
    }

    public void deleteAttempt(UUID attemptId, UUID userId, String roles) {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new NotFoundException("Attempt not found: " + attemptId));
        requireCanManage(attempt.getAssessment(), userId, roles);
        answerRepository.deleteAll(answerRepository.findByAttemptId(attemptId));
        attemptRepository.delete(attempt);
    }

    private List<AssessmentQuestionSet> visibleQuestionSets(UUID AssessmentId) {
        return questionSetRepository.findByAssessmentIdOrderBySortOrderAsc(AssessmentId).stream()
                .filter(questionSet -> !isDefaultEmptyQuestionSet(questionSet))
                .toList();
    }

    private boolean isDefaultEmptyQuestionSet(AssessmentQuestionSet questionSet) {
        return questionRepository.countByQuestionSetId(questionSet.getId()) == 0
                && questionSet.getTitle() != null
                && "tap cau hoi mac dinh".equals(questionSet.getTitle().trim().toLowerCase());
    }

    private LeaderboardSetScore toLeaderboardSetScore(AssessmentAttempt attempt) {
        long usedSeconds = calculateUsedSeconds(attempt);
        long limitSeconds = calculateLimitSeconds(attempt.getQuestionSet());
        BigDecimal score = nullToZero(attempt.getScore());
        BigDecimal timeBonus = BigDecimal.ZERO;

        if (limitSeconds > 0) {
            long remainingSeconds = Math.max(0, limitSeconds - usedSeconds);
            BigDecimal timeRatio = BigDecimal.valueOf(remainingSeconds)
                    .divide(BigDecimal.valueOf(limitSeconds), 6, RoundingMode.HALF_UP);
            timeBonus = timeRatio.multiply(BigDecimal.TEN).multiply(new BigDecimal("0.20"));
        }

        BigDecimal rankingScore = score.multiply(new BigDecimal("0.80"))
                .add(timeBonus)
                .setScale(2, RoundingMode.HALF_UP);
        return new LeaderboardSetScore(attempt, usedSeconds, limitSeconds, rankingScore, score);
    }

    private long calculateUsedSeconds(AssessmentAttempt attempt) {
        if (attempt.getUsedSeconds() != null) {
            return Math.max(0, attempt.getUsedSeconds());
        }
        if (attempt.getStartedAt() == null || attempt.getSubmittedAt() == null) {
            return 0;
        }
        return calculateUsedSeconds(attempt.getStartedAt(), attempt.getSubmittedAt());
    }

    private long calculateUsedSeconds(Instant startedAt, Instant submittedAt) {
        if (startedAt == null || submittedAt == null) {
            return 0;
        }
        return Math.max(0, Duration.between(startedAt, submittedAt).getSeconds());
    }

    private long calculateLimitSeconds(AssessmentQuestionSet questionSet) {
        Integer minutes = questionSet != null ? questionSet.getTimeLimitMinutes() : null;
        return minutes != null && minutes > 0 ? minutes * 60L : 0L;
    }

    private AssessmentResponse toResponse(Assessment Assessment) {
        return AssessmentResponse.from(Assessment, questionRepository.countByAssessmentId(Assessment.getId()));
    }

    private AssessmentQuestionSetResponse toQuestionSetResponse(AssessmentQuestionSet questionSet, UUID viewerId) {
        long questionCount = questionRepository.countByQuestionSetId(questionSet.getId());
        long attemptCount = viewerId != null
                ? attemptRepository.countByQuestionSetIdAndParticipantIdAndSubmittedAtIsNotNull(questionSet.getId(), viewerId)
                : 0;
        UUID latestAttemptId = viewerId == null ? null
                : attemptRepository.findFirstByQuestionSetIdAndParticipantIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(questionSet.getId(), viewerId)
                    .map(AssessmentAttempt::getId)
                    .orElse(null);
        return AssessmentQuestionSetResponse.from(questionSet, questionCount, attemptCount > 0, latestAttemptId, attemptCount);
    }

    private List<AssessmentQuestionResponse> getQuestions(UUID AssessmentId, boolean revealCorrect) {
        return questionRepository.findByAssessmentIdOrderBySortOrderAsc(AssessmentId).stream()
                .map(question -> toQuestionResponse(question, revealCorrect))
                .toList();
    }

    private List<AssessmentQuestionResponse> getQuestionSetQuestions(UUID questionSetId, boolean revealCorrect) {
        return questionRepository.findByQuestionSetIdOrderBySortOrderAsc(questionSetId).stream()
                .map(question -> toQuestionResponse(question, revealCorrect))
                .toList();
    }

    private AssessmentQuestionResponse toQuestionResponse(AssessmentQuestion question, boolean revealCorrect) {
        List<AssessmentChoiceResponse> choices = choiceRepository.findByQuestionIdOrderBySortOrderAsc(question.getId())
                .stream()
                .map(choice -> AssessmentChoiceResponse.from(choice, revealCorrect))
                .toList();
        return AssessmentQuestionResponse.from(question, choices);
    }

    private AssessmentSubmissionSummaryResponse toSubmissionSummary(AssessmentAttempt attempt) {
        return new AssessmentSubmissionSummaryResponse(
                attempt.getId(),
                attempt.getAssessment().getId(),
                attempt.getAssessment().getCourseId(),
                attempt.getAssessment().getTitle(),
                attempt.getQuestionSet().getId(),
                attempt.getQuestionSet().getTitle(),
                attempt.getParticipantId(),
                attempt.getParticipantEmail(),
                attempt.getScore(),
                attempt.getMaxScore(),
                attempt.getPassed(),
                attempt.getGradingStatus(),
                attempt.getStartedAt(),
                attempt.getSubmittedAt(),
                attempt.getGradedAt(),
                attempt.getUsedSeconds());
    }

    private AssessmentGradebookEntryResponse toGradebookEntry(UUID participantId, List<AssessmentAttempt> attempts) {
        long submittedAttempts = attempts.size();
        List<AssessmentAttempt> gradedAttempts = attempts.stream()
                .filter(attempt -> attempt.getGradingStatus() == GradingStatus.GRADED)
                .toList();
        BigDecimal totalScore = gradedAttempts.stream()
                .map(attempt -> nullToZero(attempt.getScore()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalMaxScore = gradedAttempts.stream()
                .map(attempt -> nullToZero(attempt.getMaxScore()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal averageScore = totalMaxScore.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : totalScore.multiply(BigDecimal.TEN).divide(totalMaxScore, 2, RoundingMode.HALF_UP);
        String participantEmail = attempts.stream()
                .map(AssessmentAttempt::getParticipantEmail)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
        return new AssessmentGradebookEntryResponse(
                participantId,
                participantEmail,
                gradedAttempts.size(),
                submittedAttempts,
                totalScore,
                totalMaxScore,
                averageScore);
    }

    private void applyAssessmentRequest(Assessment Assessment, AssessmentRequest request) {
        Assessment.setTitle(request.title());
        Assessment.setDescription(request.description());
        Assessment.setThumbnailUrl(request.thumbnailUrl());
        Assessment.setCategory(request.category());
        Assessment.setStatus(request.status() != null ? request.status() : AssessmentStatus.DRAFT);
        Assessment.setTimeLimitMinutes(request.timeLimitMinutes());
        Assessment.setMaxAttempts(request.maxAttempts() != null && request.maxAttempts() > 0 ? request.maxAttempts() : 1);
    }

    private void applyQuestionSetRequest(AssessmentQuestionSet questionSet, AssessmentQuestionSetRequest request) {
        questionSet.setTitle(request.title());
        questionSet.setTimeLimitMinutes(request.timeLimitMinutes());
        questionSet.setSortOrder(request.sortOrder() != null ? request.sortOrder() : 0);
        questionSet.setMaxAttempts(request.maxAttempts() != null && request.maxAttempts() > 0 ? request.maxAttempts() : null);
    }

    private void applyQuestionRequest(AssessmentQuestion question, AssessmentQuestionRequest request) {
        validateQuestion(request);
        question.setTitle(request.title());
        question.setPrompt(request.prompt());
        question.setType(request.type());
        question.setMediaType(request.mediaType() != null ? request.mediaType() : QuestionMediaType.NONE);
        question.setMediaUrl(request.mediaUrl());
        question.setPoints(request.points() != null ? request.points() : BigDecimal.ONE);
        question.setSortOrder(request.sortOrder() != null ? request.sortOrder() : 0);
    }

    private void saveChoices(AssessmentQuestion question, AssessmentQuestionRequest request) {
        if (question.getType() != AssessmentQuestionType.MULTIPLE_CHOICE) {
            return;
        }
        int index = 0;
        for (AssessmentChoiceRequest choiceRequest : request.choices()) {
            AssessmentChoice choice = new AssessmentChoice();
            choice.setQuestion(question);
            choice.setText(choiceRequest.text().trim());
            choice.setIsCorrect(Boolean.TRUE.equals(choiceRequest.isCorrect()));
            choice.setSortOrder(choiceRequest.sortOrder() != null ? choiceRequest.sortOrder() : index);
            choiceRepository.save(choice);
            index++;
        }
    }

    private void syncChoices(AssessmentQuestion question, AssessmentQuestionRequest request) {
        if (question.getType() != AssessmentQuestionType.MULTIPLE_CHOICE) {
            return;
        }

        List<AssessmentChoice> existingChoices = choiceRepository.findByQuestionIdOrderBySortOrderAsc(question.getId());
        List<AssessmentChoiceRequest> requestedChoices = Optional.ofNullable(request.choices()).orElse(List.of()).stream()
                .filter(choice -> choice.text() != null && !choice.text().isBlank())
                .toList();

        for (int index = 0; index < requestedChoices.size(); index++) {
            AssessmentChoiceRequest choiceRequest = requestedChoices.get(index);
            AssessmentChoice choice = index < existingChoices.size()
                    ? existingChoices.get(index)
                    : new AssessmentChoice();
            choice.setQuestion(question);
            choice.setText(choiceRequest.text().trim());
            choice.setIsCorrect(Boolean.TRUE.equals(choiceRequest.isCorrect()));
            choice.setSortOrder(choiceRequest.sortOrder() != null ? choiceRequest.sortOrder() : index);
            choiceRepository.save(choice);
        }

        for (int index = requestedChoices.size(); index < existingChoices.size(); index++) {
            choiceRepository.delete(existingChoices.get(index));
        }
    }

    private void deleteSubmittedAttemptsForQuestionSet(UUID questionSetId) {
        for (AssessmentAttempt attempt : attemptRepository.findByQuestionSetIdAndSubmittedAtIsNotNull(questionSetId)) {
            attemptRepository.delete(attempt);
        }
    }

    private void validateQuestion(AssessmentQuestionRequest request) {
        if (request.type() == AssessmentQuestionType.MULTIPLE_CHOICE) {
            List<AssessmentChoiceRequest> choices = Optional.ofNullable(request.choices()).orElse(List.of()).stream()
                    .filter(choice -> choice.text() != null && !choice.text().isBlank())
                    .toList();
            if (choices.size() < 2) {
                throw new ValidationException("Multiple choice questions need at least 2 choices.");
            }
            long correctCount = choices.stream().filter(choice -> Boolean.TRUE.equals(choice.isCorrect())).count();
            if (correctCount != 1) {
                throw new ValidationException("Multiple choice questions need exactly one correct answer.");
            }
        }
    }

    private AssessmentAttemptResultResponse toAttemptResult(AssessmentAttempt attempt, List<AssessmentAnswer> answers, boolean revealCorrect) {
        List<AssessmentAnswerResultResponse> answerResults = answers.stream()
                .map(answer -> {
                    AssessmentQuestion question = answer.getQuestion();
                    AssessmentChoice selected = answer.getChoice();
                    List<AssessmentChoice> choices = question.getType() == AssessmentQuestionType.MULTIPLE_CHOICE
                            ? choiceRepository.findByQuestionIdOrderBySortOrderAsc(question.getId())
                            : List.of();
                    AssessmentChoice correct = choices.stream()
                            .filter(choice -> Boolean.TRUE.equals(choice.getIsCorrect()))
                            .findFirst()
                            .orElse(null);
                    return new AssessmentAnswerResultResponse(
                            question.getId(),
                            question.getTitle(),
                            question.getPrompt(),
                            question.getType(),
                            question.getPoints(),
                            choices.stream()
                                    .map(choice -> AssessmentChoiceResponse.from(choice, revealCorrect))
                                    .toList(),
                            selected != null ? selected.getId() : null,
                            selected != null ? selected.getText() : null,
                            revealCorrect && correct != null ? correct.getId() : null,
                            revealCorrect && correct != null ? correct.getText() : null,
                            answer.getIsCorrect(),
                            answer.getTextAnswer(),
                            answer.getFileName(),
                            answer.getFileType(),
                            answer.getFileSize(),
                            attempt.getGradingStatus().name());
                })
                .toList();
        return new AssessmentAttemptResultResponse(
                attempt.getId(),
                attempt.getAssessment().getId(),
                attempt.getQuestionSet().getId(),
                attempt.getQuestionSet().getTitle(),
                attempt.getParticipantId(),
                attempt.getParticipantEmail(),
                attempt.getScore(),
                attempt.getMaxScore(),
                attempt.getPassed(),
                attempt.getGradingStatus(),
                attempt.getStartedAt(),
                attempt.getSubmittedAt(),
                attempt.getGradedAt(),
                attempt.getUsedSeconds(),
                answerResults);
    }

    private AssessmentQuestionSet createDefaultQuestionSet(Assessment Assessment) {
        AssessmentQuestionSet questionSet = new AssessmentQuestionSet();
        questionSet.setAssessment(Assessment);
        questionSet.setTitle("Tap cau hoi mac dinh");
        questionSet.setTimeLimitMinutes(Assessment.getTimeLimitMinutes());
        questionSet.setSortOrder(0);
        return questionSetRepository.save(questionSet);
    }

    private AssessmentQuestionSet getOrCreateDefaultQuestionSet(Assessment Assessment) {
        return questionSetRepository.findFirstByAssessmentIdOrderBySortOrderAsc(Assessment.getId())
                .orElseGet(() -> createDefaultQuestionSet(Assessment));
    }

    private int normalizedMaxAttempts(AssessmentQuestionSet questionSet) {
        Integer maxAttempts = questionSet.getMaxAttempts();
        if (maxAttempts != null && maxAttempts > 0) {
            return maxAttempts;
        }
        Integer assessmentMaxAttempts = questionSet.getAssessment().getMaxAttempts();
        return assessmentMaxAttempts != null && assessmentMaxAttempts > 0 ? assessmentMaxAttempts : 1;
    }

    private void ensureAttemptWithinTimeLimit(AssessmentAttempt attempt) {
        AssessmentQuestionSet questionSet = attempt.getQuestionSet();
        Integer timeLimitMinutes = questionSet != null ? questionSet.getTimeLimitMinutes() : null;
        if (timeLimitMinutes == null || timeLimitMinutes <= 0 || attempt.getStartedAt() == null) {
            return;
        }
        Instant deadlineWithGrace = attempt.getStartedAt()
                .plus(Duration.ofMinutes(timeLimitMinutes))
                .plus(Duration.ofSeconds(60));
        if (Instant.now().isAfter(deadlineWithGrace)) {
            throw new ValidationException("This attempt is past the allowed time limit.");
        }
    }

    private BigDecimal nullToOne(BigDecimal value) {
        return value != null ? value : BigDecimal.ONE;
    }

    private BigDecimal nullToZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private record LeaderboardSetScore(
            AssessmentAttempt attempt,
            long usedSeconds,
            long limitSeconds,
            BigDecimal rankingScore,
            BigDecimal attemptScore
    ) {}

    private record LeaderboardParticipantScore(
            UUID participantId,
            String participantEmail,
            long completedQuestionSets,
            long totalQuestionSets,
            long totalUsedSeconds,
            long totalLimitSeconds,
            BigDecimal accuracyPercent,
            BigDecimal rankingScore,
            Instant firstStartedAt
    ) {}

    private static class LeaderboardParticipant {
        private final UUID participantId;
        private String participantEmail;
        private final Map<UUID, LeaderboardSetScore> bestByQuestionSet = new HashMap<>();

        private LeaderboardParticipant(UUID participantId, String participantEmail) {
            this.participantId = participantId;
            this.participantEmail = participantEmail;
        }

        private void keepBestAttempt(UUID questionSetId, LeaderboardSetScore candidate) {
            if (participantEmail == null && candidate.attempt().getParticipantEmail() != null) {
                participantEmail = candidate.attempt().getParticipantEmail();
            }

            LeaderboardSetScore current = bestByQuestionSet.get(questionSetId);
            if (current == null || isBetter(candidate, current)) {
                bestByQuestionSet.put(questionSetId, candidate);
            }
        }

        private boolean isBetter(LeaderboardSetScore candidate, LeaderboardSetScore current) {
            int scoreCompare = candidate.rankingScore().compareTo(current.rankingScore());
            if (scoreCompare != 0) {
                return scoreCompare > 0;
            }
            if (candidate.usedSeconds() != current.usedSeconds()) {
                return candidate.usedSeconds() < current.usedSeconds();
            }
            Instant candidateStartedAt = candidate.attempt().getStartedAt();
            Instant currentStartedAt = current.attempt().getStartedAt();
            if (candidateStartedAt == null) {
                return false;
            }
            if (currentStartedAt == null) {
                return true;
            }
            return candidateStartedAt.isBefore(currentStartedAt);
        }

        private LeaderboardParticipantScore toScore(long totalQuestionSets) {
            long completedQuestionSets = bestByQuestionSet.size();
            long totalUsedSeconds = bestByQuestionSet.values().stream()
                    .mapToLong(LeaderboardSetScore::usedSeconds)
                    .sum();
            long totalLimitSeconds = bestByQuestionSet.values().stream()
                    .mapToLong(LeaderboardSetScore::limitSeconds)
                    .sum();
            BigDecimal rankingScore = bestByQuestionSet.values().stream()
                    .map(LeaderboardSetScore::rankingScore)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal attemptScoreSum = bestByQuestionSet.values().stream()
                    .map(LeaderboardSetScore::attemptScore)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal accuracyPercent = completedQuestionSets == 0
                    ? BigDecimal.ZERO
                    : attemptScoreSum.multiply(BigDecimal.TEN)
                            .divide(BigDecimal.valueOf(completedQuestionSets), 2, RoundingMode.HALF_UP);
            Instant firstStartedAt = bestByQuestionSet.values().stream()
                    .map(score -> score.attempt().getStartedAt())
                    .filter(Objects::nonNull)
                    .min(Instant::compareTo)
                    .orElse(Instant.EPOCH);
            return new LeaderboardParticipantScore(
                    participantId,
                    participantEmail,
                    completedQuestionSets,
                    totalQuestionSets,
                    totalUsedSeconds,
                    totalLimitSeconds,
                    accuracyPercent,
                    rankingScore,
                    firstStartedAt);
        }
    }

    private Assessment findAssessment(UUID AssessmentId) {
        return assessmentRepository.findById(AssessmentId)
                .orElseThrow(() -> new NotFoundException("Assessment not found: " + AssessmentId));
    }

    private AssessmentQuestionSet findQuestionSet(UUID questionSetId) {
        return questionSetRepository.findById(questionSetId)
                .orElseThrow(() -> new NotFoundException("Question set not found: " + questionSetId));
    }

    private AssessmentQuestion findQuestion(UUID questionId) {
        return questionRepository.findById(questionId)
                .orElseThrow(() -> new NotFoundException("Question not found: " + questionId));
    }

    private boolean canManage(Assessment Assessment, UUID userId, String roles) {
        return RoleUtils.isAdmin(roles)
                || (RoleUtils.isInstructor(roles) && courseAccessClient.isCourseOwner(Assessment.getCourseId(), userId));
    }

    private void requireCanManage(Assessment Assessment, UUID userId, String roles) {
        if (!canManage(Assessment, userId, roles)) {
            throw new ForbiddenException("Assessment owner or admin role required.");
        }
    }

    private void requireCanView(Assessment Assessment, UUID userId, String roles) {
        if (canManage(Assessment, userId, roles)) {
            return;
        }
        if (Assessment.getStatus() == AssessmentStatus.PUBLISHED
                && courseAccessClient.canAccessCourseContent(Assessment.getCourseId(), userId, roles)) {
            return;
        }
        throw new ForbiddenException("Assessment is not published.");
    }

    private void requireCourseManager(UUID courseId, UUID userId, String roles) {
        if (RoleUtils.isAdmin(roles) || courseAccessClient.isCourseOwner(courseId, userId)) {
            return;
        }
        throw new ForbiddenException("Course owner or admin role required.");
    }

    private void requireCourseContentAccess(UUID courseId, UUID userId, String roles) {
        if (RoleUtils.isAdmin(roles) || courseAccessClient.isCourseOwner(courseId, userId)
                || courseAccessClient.canAccessCourseContent(courseId, userId, roles)) {
            return;
        }
        throw new ForbiddenException("Course enrollment is required.");
    }

    private void requireInstructorOrAdmin(String roles) {
        if (!RoleUtils.isInstructorOrAdmin(roles)) {
            throw new ForbiddenException("Instructor or admin role required.");
        }
    }

    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String message) { super(message); }
    }

    public static class ForbiddenException extends RuntimeException {
        public ForbiddenException(String message) { super(message); }
    }

    public static class ValidationException extends RuntimeException {
        public ValidationException(String message) { super(message); }
    }
}




