package dev.sagelms.challenge.service;

import dev.sagelms.challenge.dto.*;
import dev.sagelms.challenge.entity.*;
import dev.sagelms.challenge.repository.*;
import dev.sagelms.challenge.security.RoleUtils;
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
public class ChallengeService {

    private final ChallengeRepository challengeRepository;
    private final ChallengeQuestionSetRepository questionSetRepository;
    private final ChallengeQuestionRepository questionRepository;
    private final ChallengeChoiceRepository choiceRepository;
    private final ChallengeAttemptRepository attemptRepository;
    private final ChallengeAnswerRepository answerRepository;

    public ChallengeService(
            ChallengeRepository challengeRepository,
            ChallengeQuestionSetRepository questionSetRepository,
            ChallengeQuestionRepository questionRepository,
            ChallengeChoiceRepository choiceRepository,
            ChallengeAttemptRepository attemptRepository,
            ChallengeAnswerRepository answerRepository) {
        this.challengeRepository = challengeRepository;
        this.questionSetRepository = questionSetRepository;
        this.questionRepository = questionRepository;
        this.choiceRepository = choiceRepository;
        this.attemptRepository = attemptRepository;
        this.answerRepository = answerRepository;
    }

    @Transactional(readOnly = true)
    public Page<ChallengeResponse> listChallenges(String search, String category, UUID viewerId, String roles, Pageable pageable) {
        String normalizedSearch = search != null && !search.isBlank() ? search.trim() : null;
        String normalizedCategory = category != null && !category.isBlank() ? category.trim() : null;
        Page<Challenge> challenges;
        if (RoleUtils.isAdmin(roles)) {
            challenges = challengeRepository.findAllFiltered(normalizedSearch, normalizedCategory, pageable);
        } else if (RoleUtils.isInstructor(roles) && viewerId != null) {
            challenges = challengeRepository.findVisibleToInstructorFiltered(viewerId, normalizedSearch, normalizedCategory, pageable);
        } else {
            challenges = challengeRepository.findPublishedFiltered(normalizedSearch, normalizedCategory, pageable);
        }
        return challenges.map(this::toResponse);
    }

    public ChallengeResponse createChallenge(ChallengeRequest request, UUID instructorId, String roles) {
        requireInstructorOrAdmin(roles);
        if (instructorId == null) {
            throw new ForbiddenException("Missing user context.");
        }
        Challenge challenge = new Challenge();
        applyChallengeRequest(challenge, request);
        challenge.setInstructorId(instructorId);
        Challenge saved = challengeRepository.save(challenge);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public ChallengeDetailResponse getChallenge(UUID challengeId, UUID viewerId, String roles) {
        Challenge challenge = findChallenge(challengeId);
        requireCanView(challenge, viewerId, roles);
        boolean manager = canManage(challenge, viewerId, roles);
        return new ChallengeDetailResponse(
                toResponse(challenge),
                getQuestions(challengeId, manager),
                getQuestionSets(challengeId, viewerId, roles));
    }

    public ChallengeResponse updateChallenge(UUID challengeId, ChallengeRequest request, UUID userId, String roles) {
        Challenge challenge = findChallenge(challengeId);
        requireCanManage(challenge, userId, roles);
        applyChallengeRequest(challenge, request);
        return toResponse(challengeRepository.save(challenge));
    }

    public void deleteChallenge(UUID challengeId, UUID userId, String roles) {
        Challenge challenge = findChallenge(challengeId);
        requireCanManage(challenge, userId, roles);
        challengeRepository.delete(challenge);
    }

    @Transactional(readOnly = true)
    public List<ChallengeQuestionSetResponse> getQuestionSets(UUID challengeId, UUID viewerId, String roles) {
        Challenge challenge = findChallenge(challengeId);
        requireCanView(challenge, viewerId, roles);
        return questionSetRepository.findByChallengeIdOrderBySortOrderAsc(challengeId).stream()
                .map(questionSet -> toQuestionSetResponse(questionSet, viewerId))
                .toList();
    }

    @Transactional(readOnly = true)
    public ChallengeQuestionSetDetailResponse getQuestionSet(UUID questionSetId, UUID viewerId, String roles) {
        ChallengeQuestionSet questionSet = findQuestionSet(questionSetId);
        requireCanView(questionSet.getChallenge(), viewerId, roles);
        boolean revealCorrect = canManage(questionSet.getChallenge(), viewerId, roles);
        return new ChallengeQuestionSetDetailResponse(
                toQuestionSetResponse(questionSet, viewerId),
                getQuestionSetQuestions(questionSetId, revealCorrect));
    }

    public ChallengeQuestionSetResponse createQuestionSet(
            UUID challengeId,
            ChallengeQuestionSetRequest request,
            UUID userId,
            String roles) {
        Challenge challenge = findChallenge(challengeId);
        requireCanManage(challenge, userId, roles);
        ChallengeQuestionSet questionSet = new ChallengeQuestionSet();
        questionSet.setChallenge(challenge);
        applyQuestionSetRequest(questionSet, request);
        ChallengeQuestionSet saved = questionSetRepository.save(questionSet);
        return toQuestionSetResponse(saved, userId);
    }

    public ChallengeQuestionSetResponse updateQuestionSet(
            UUID questionSetId,
            ChallengeQuestionSetRequest request,
            UUID userId,
            String roles) {
        ChallengeQuestionSet questionSet = findQuestionSet(questionSetId);
        requireCanManage(questionSet.getChallenge(), userId, roles);
        requireNoSubmittedAttemptsForQuestionSet(questionSetId);
        applyQuestionSetRequest(questionSet, request);
        return toQuestionSetResponse(questionSetRepository.save(questionSet), userId);
    }

    public void deleteQuestionSet(UUID questionSetId, UUID userId, String roles) {
        ChallengeQuestionSet questionSet = findQuestionSet(questionSetId);
        requireCanManage(questionSet.getChallenge(), userId, roles);
        requireNoSubmittedAttemptsForQuestionSet(questionSetId);
        questionSetRepository.delete(questionSet);
    }

    @Transactional(readOnly = true)
    public List<ChallengeQuestionResponse> getQuestions(UUID challengeId, UUID viewerId, String roles) {
        Challenge challenge = findChallenge(challengeId);
        requireCanView(challenge, viewerId, roles);
        return getQuestions(challengeId, canManage(challenge, viewerId, roles));
    }

    public ChallengeQuestionResponse addQuestion(UUID questionSetId, ChallengeQuestionRequest request, UUID userId, String roles) {
        ChallengeQuestionSet questionSet = findQuestionSet(questionSetId);
        requireCanManage(questionSet.getChallenge(), userId, roles);
        requireNoSubmittedAttemptsForQuestionSet(questionSet.getId());
        ChallengeQuestion question = new ChallengeQuestion();
        question.setChallenge(questionSet.getChallenge());
        question.setQuestionSet(questionSet);
        applyQuestionRequest(question, request);
        ChallengeQuestion saved = questionRepository.save(question);
        saveChoices(saved, request);
        return toQuestionResponse(saved, true);
    }

    public ChallengeQuestionResponse addQuestionToChallenge(UUID challengeId, ChallengeQuestionRequest request, UUID userId, String roles) {
        Challenge challenge = findChallenge(challengeId);
        requireCanManage(challenge, userId, roles);
        ChallengeQuestionSet questionSet = getOrCreateDefaultQuestionSet(challenge);
        return addQuestion(questionSet.getId(), request, userId, roles);
    }

    public ChallengeQuestionResponse updateQuestion(UUID questionId, ChallengeQuestionRequest request, UUID userId, String roles) {
        ChallengeQuestion question = findQuestion(questionId);
        requireCanManage(question.getChallenge(), userId, roles);
        UUID questionSetId = question.getQuestionSet() != null ? question.getQuestionSet().getId() : null;
        if (questionSetId != null) {
            requireNoSubmittedAttemptsForQuestionSet(questionSetId);
        }
        applyQuestionRequest(question, request);
        ChallengeQuestion saved = questionRepository.save(question);
        syncChoices(saved, request);
        return toQuestionResponse(saved, true);
    }

    public void deleteQuestion(UUID questionId, UUID userId, String roles) {
        ChallengeQuestion question = findQuestion(questionId);
        requireCanManage(question.getChallenge(), userId, roles);
        if (question.getQuestionSet() != null) {
            requireNoSubmittedAttemptsForQuestionSet(question.getQuestionSet().getId());
        }
        questionRepository.delete(question);
    }

    public StartAttemptResponse startAttempt(UUID questionSetId, UUID participantId, String participantEmail, String roles) {
        if (participantId == null) {
            throw new ForbiddenException("Login required to join this challenge.");
        }
        ChallengeQuestionSet questionSet = findQuestionSet(questionSetId);
        Challenge challenge = questionSet.getChallenge();
        if (challenge.getStatus() != ChallengeStatus.PUBLISHED && !canManage(challenge, participantId, roles)) {
            throw new ForbiddenException("Challenge is not open for participation.");
        }
        long submittedAttempts = attemptRepository.countByQuestionSetIdAndParticipantIdAndSubmittedAtIsNotNull(
                questionSetId,
                participantId);
        int maxAttempts = normalizedMaxAttempts(challenge);
        if (submittedAttempts >= maxAttempts) {
            throw new ValidationException("You have already submitted this challenge attempt.");
        }

        Optional<ChallengeAttempt> existingAttempt = attemptRepository
                .findFirstByQuestionSetIdAndParticipantIdAndSubmittedAtIsNullOrderByStartedAtDesc(questionSetId, participantId);
        if (existingAttempt.isPresent()) {
            ChallengeAttempt attempt = existingAttempt.get();
            return new StartAttemptResponse(
                    attempt.getId(),
                    challenge.getId(),
                    questionSet.getId(),
                    participantId,
                    attempt.getStartedAt(),
                    questionSet.getTimeLimitMinutes(),
                    getQuestionSetQuestions(questionSetId, false));
        }

        ChallengeAttempt attempt = new ChallengeAttempt();
        attempt.setChallenge(challenge);
        attempt.setQuestionSet(questionSet);
        attempt.setParticipantId(participantId);
        attempt.setParticipantEmail(participantEmail);
        attempt.setGradingStatus(GradingStatus.IN_PROGRESS);
        ChallengeAttempt saved = attemptRepository.save(attempt);
        return new StartAttemptResponse(
                saved.getId(),
                challenge.getId(),
                questionSet.getId(),
                participantId,
                saved.getStartedAt(),
                questionSet.getTimeLimitMinutes(),
                getQuestionSetQuestions(questionSetId, false));
    }

    public StartAttemptResponse startChallengeAttempt(UUID challengeId, UUID participantId, String participantEmail, String roles) {
        Challenge challenge = findChallenge(challengeId);
        ChallengeQuestionSet questionSet = getOrCreateDefaultQuestionSet(challenge);
        return startAttempt(questionSet.getId(), participantId, participantEmail, roles);
    }

    public ChallengeAttemptResultResponse submitAttempt(
            UUID attemptId,
            SubmitChallengeAttemptRequest request,
            UUID participantId) {
        ChallengeAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new NotFoundException("Attempt not found: " + attemptId));
        if (!attempt.getParticipantId().equals(participantId)) {
            throw new ForbiddenException("You can only submit your own attempt.");
        }
        if (attempt.getSubmittedAt() != null) {
            throw new ValidationException("Attempt already submitted.");
        }
        ensureAttemptWithinTimeLimit(attempt);

        Map<UUID, SubmitChallengeAnswerRequest> submitted = new HashMap<>();
        for (SubmitChallengeAnswerRequest answer : Optional.ofNullable(request.answers()).orElse(List.of())) {
            if (answer.questionId() != null) {
                submitted.put(answer.questionId(), answer);
            }
        }

        List<ChallengeQuestion> questions = questionRepository.findByQuestionSetIdOrderBySortOrderAsc(
                attempt.getQuestionSet().getId());
        for (ChallengeQuestion question : questions) {
            SubmitChallengeAnswerRequest submittedAnswer = submitted.get(question.getId());
            ChallengeAnswer answer = new ChallengeAnswer();
            answer.setAttempt(attempt);
            answer.setQuestion(question);

            if (question.getType() == ChallengeQuestionType.MULTIPLE_CHOICE) {
                ChallengeChoice selected = null;
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
        attempt.setSubmittedAt(Instant.now());
        attempt.setGradingStatus(GradingStatus.PENDING_REVIEW);
        attemptRepository.save(attempt);
        return toAttemptResult(attempt, answerRepository.findByAttemptId(attemptId), false);
    }

    @Transactional(readOnly = true)
    public ChallengeAttemptResultResponse getAttemptResult(UUID attemptId, UUID participantId) {
        ChallengeAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new NotFoundException("Attempt not found: " + attemptId));
        if (!attempt.getParticipantId().equals(participantId)) {
            throw new ForbiddenException("You can only view your own attempt result.");
        }
        return toAttemptResult(attempt, answerRepository.findByAttemptId(attemptId), attempt.getGradingStatus() == GradingStatus.GRADED);
    }

    @Transactional(readOnly = true)
    public List<ChallengeSubmissionSummaryResponse> getSubmissions(UUID challengeId, UUID userId, String roles) {
        Challenge challenge = findChallenge(challengeId);
        requireCanManage(challenge, userId, roles);
        return attemptRepository.findByChallengeIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(challengeId).stream()
                .map(this::toSubmissionSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChallengeSubmissionSummaryResponse> getMyGradedSubmissions(UUID challengeId, UUID participantId, String roles) {
        if (participantId == null) {
            throw new ForbiddenException("Login required to view challenge results.");
        }
        Challenge challenge = findChallenge(challengeId);
        requireCanView(challenge, participantId, roles);
        return attemptRepository.findByChallengeIdAndParticipantIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(challengeId, participantId).stream()
                .filter(attempt -> attempt.getGradingStatus() == GradingStatus.GRADED)
                .map(this::toSubmissionSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChallengeSubmissionSummaryResponse> getParticipantSubmissions(UUID challengeId, UUID participantId, UUID userId, String roles) {
        Challenge challenge = findChallenge(challengeId);
        requireCanManage(challenge, userId, roles);
        return attemptRepository.findByChallengeIdAndParticipantIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(challengeId, participantId).stream()
                .map(this::toSubmissionSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChallengeLeaderboardEntryResponse> getLeaderboard(UUID challengeId, UUID viewerId, String roles) {
        Challenge challenge = findChallenge(challengeId);
        requireCanView(challenge, viewerId, roles);

        List<ChallengeQuestionSet> visibleSets = visibleQuestionSets(challengeId);
        Set<UUID> visibleSetIds = visibleSets.stream()
                .map(ChallengeQuestionSet::getId)
                .collect(Collectors.toSet());
        long totalQuestionSets = visibleSets.size();

        Map<UUID, LeaderboardParticipant> participants = new HashMap<>();
        for (ChallengeAttempt attempt : attemptRepository
                .findByChallengeIdAndGradingStatusAndSubmittedAtIsNotNullOrderBySubmittedAtAsc(challengeId, GradingStatus.GRADED)) {
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

        List<ChallengeLeaderboardEntryResponse> leaderboard = new ArrayList<>();
        for (int index = 0; index < scores.size(); index++) {
            LeaderboardParticipantScore score = scores.get(index);
            leaderboard.add(new ChallengeLeaderboardEntryResponse(
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
    public ChallengeAttemptResultResponse getAttemptReview(UUID attemptId, UUID userId, String roles) {
        ChallengeAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new NotFoundException("Attempt not found: " + attemptId));
        requireCanManage(attempt.getChallenge(), userId, roles);
        return toAttemptResult(attempt, answerRepository.findByAttemptId(attemptId), true);
    }

    public ChallengeAttemptResultResponse gradeAttempt(
            UUID attemptId,
            GradeChallengeAttemptRequest request,
            UUID graderId,
            String roles) {
        ChallengeAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new NotFoundException("Attempt not found: " + attemptId));
        requireCanManage(attempt.getChallenge(), graderId, roles);
        if (attempt.getSubmittedAt() == null) {
            throw new ValidationException("Attempt has not been submitted.");
        }

        Map<UUID, Boolean> grades = Optional.ofNullable(request.answers()).orElse(List.of()).stream()
                .collect(Collectors.toMap(GradeChallengeAnswerRequest::questionId, GradeChallengeAnswerRequest::isCorrect));
        List<ChallengeAnswer> answers = answerRepository.findByAttemptId(attemptId);
        BigDecimal earnedPoints = BigDecimal.ZERO;
        BigDecimal totalPoints = BigDecimal.ZERO;
        for (ChallengeAnswer answer : answers) {
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
        ChallengeAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new NotFoundException("Attempt not found: " + attemptId));
        requireCanManage(attempt.getChallenge(), userId, roles);
        answerRepository.deleteAll(answerRepository.findByAttemptId(attemptId));
        attemptRepository.delete(attempt);
    }

    private List<ChallengeQuestionSet> visibleQuestionSets(UUID challengeId) {
        return questionSetRepository.findByChallengeIdOrderBySortOrderAsc(challengeId).stream()
                .filter(questionSet -> !isDefaultEmptyQuestionSet(questionSet))
                .toList();
    }

    private boolean isDefaultEmptyQuestionSet(ChallengeQuestionSet questionSet) {
        return questionRepository.countByQuestionSetId(questionSet.getId()) == 0
                && questionSet.getTitle() != null
                && "tap cau hoi mac dinh".equals(questionSet.getTitle().trim().toLowerCase());
    }

    private LeaderboardSetScore toLeaderboardSetScore(ChallengeAttempt attempt) {
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

    private long calculateUsedSeconds(ChallengeAttempt attempt) {
        if (attempt.getStartedAt() == null || attempt.getSubmittedAt() == null) {
            return 0;
        }
        return Math.max(0, Duration.between(attempt.getStartedAt(), attempt.getSubmittedAt()).getSeconds());
    }

    private long calculateLimitSeconds(ChallengeQuestionSet questionSet) {
        Integer minutes = questionSet != null ? questionSet.getTimeLimitMinutes() : null;
        return minutes != null && minutes > 0 ? minutes * 60L : 0L;
    }

    private ChallengeResponse toResponse(Challenge challenge) {
        return ChallengeResponse.from(challenge, questionRepository.countByChallengeId(challenge.getId()));
    }

    private ChallengeQuestionSetResponse toQuestionSetResponse(ChallengeQuestionSet questionSet, UUID viewerId) {
        long questionCount = questionRepository.countByQuestionSetId(questionSet.getId());
        long attemptCount = viewerId != null
                ? attemptRepository.countByQuestionSetIdAndParticipantIdAndSubmittedAtIsNotNull(questionSet.getId(), viewerId)
                : 0;
        UUID latestAttemptId = viewerId == null ? null
                : attemptRepository.findFirstByQuestionSetIdAndParticipantIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(questionSet.getId(), viewerId)
                    .map(ChallengeAttempt::getId)
                    .orElse(null);
        return ChallengeQuestionSetResponse.from(questionSet, questionCount, attemptCount > 0, latestAttemptId, attemptCount);
    }

    private List<ChallengeQuestionResponse> getQuestions(UUID challengeId, boolean revealCorrect) {
        return questionRepository.findByChallengeIdOrderBySortOrderAsc(challengeId).stream()
                .map(question -> toQuestionResponse(question, revealCorrect))
                .toList();
    }

    private List<ChallengeQuestionResponse> getQuestionSetQuestions(UUID questionSetId, boolean revealCorrect) {
        return questionRepository.findByQuestionSetIdOrderBySortOrderAsc(questionSetId).stream()
                .map(question -> toQuestionResponse(question, revealCorrect))
                .toList();
    }

    private ChallengeQuestionResponse toQuestionResponse(ChallengeQuestion question, boolean revealCorrect) {
        List<ChallengeChoiceResponse> choices = choiceRepository.findByQuestionIdOrderBySortOrderAsc(question.getId())
                .stream()
                .map(choice -> ChallengeChoiceResponse.from(choice, revealCorrect))
                .toList();
        return ChallengeQuestionResponse.from(question, choices);
    }

    private ChallengeSubmissionSummaryResponse toSubmissionSummary(ChallengeAttempt attempt) {
        return new ChallengeSubmissionSummaryResponse(
                attempt.getId(),
                attempt.getChallenge().getId(),
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
                attempt.getGradedAt());
    }

    private void applyChallengeRequest(Challenge challenge, ChallengeRequest request) {
        challenge.setTitle(request.title());
        challenge.setDescription(request.description());
        challenge.setThumbnailUrl(request.thumbnailUrl());
        challenge.setCategory(request.category());
        challenge.setStatus(request.status() != null ? request.status() : ChallengeStatus.DRAFT);
        challenge.setTimeLimitMinutes(request.timeLimitMinutes());
        challenge.setMaxAttempts(request.maxAttempts() != null && request.maxAttempts() > 0 ? request.maxAttempts() : 1);
    }

    private void applyQuestionSetRequest(ChallengeQuestionSet questionSet, ChallengeQuestionSetRequest request) {
        questionSet.setTitle(request.title());
        questionSet.setTimeLimitMinutes(request.timeLimitMinutes());
        questionSet.setSortOrder(request.sortOrder() != null ? request.sortOrder() : 0);
    }

    private void applyQuestionRequest(ChallengeQuestion question, ChallengeQuestionRequest request) {
        validateQuestion(request);
        question.setTitle(request.title());
        question.setPrompt(request.prompt());
        question.setType(request.type());
        question.setMediaType(request.mediaType() != null ? request.mediaType() : QuestionMediaType.NONE);
        question.setMediaUrl(request.mediaUrl());
        question.setPoints(request.points() != null ? request.points() : BigDecimal.ONE);
        question.setSortOrder(request.sortOrder() != null ? request.sortOrder() : 0);
    }

    private void saveChoices(ChallengeQuestion question, ChallengeQuestionRequest request) {
        if (question.getType() != ChallengeQuestionType.MULTIPLE_CHOICE) {
            return;
        }
        int index = 0;
        for (ChallengeChoiceRequest choiceRequest : request.choices()) {
            ChallengeChoice choice = new ChallengeChoice();
            choice.setQuestion(question);
            choice.setText(choiceRequest.text().trim());
            choice.setIsCorrect(Boolean.TRUE.equals(choiceRequest.isCorrect()));
            choice.setSortOrder(choiceRequest.sortOrder() != null ? choiceRequest.sortOrder() : index);
            choiceRepository.save(choice);
            index++;
        }
    }

    private void syncChoices(ChallengeQuestion question, ChallengeQuestionRequest request) {
        if (question.getType() != ChallengeQuestionType.MULTIPLE_CHOICE) {
            return;
        }

        List<ChallengeChoice> existingChoices = choiceRepository.findByQuestionIdOrderBySortOrderAsc(question.getId());
        List<ChallengeChoiceRequest> requestedChoices = Optional.ofNullable(request.choices()).orElse(List.of()).stream()
                .filter(choice -> choice.text() != null && !choice.text().isBlank())
                .toList();

        for (int index = 0; index < requestedChoices.size(); index++) {
            ChallengeChoiceRequest choiceRequest = requestedChoices.get(index);
            ChallengeChoice choice = index < existingChoices.size()
                    ? existingChoices.get(index)
                    : new ChallengeChoice();
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

    private void requireNoSubmittedAttemptsForQuestionSet(UUID questionSetId) {
        if (!attemptRepository.findByQuestionSetIdAndSubmittedAtIsNotNull(questionSetId).isEmpty()) {
            throw new ValidationException("This question set already has submitted attempts and cannot be changed.");
        }
    }

    private void validateQuestion(ChallengeQuestionRequest request) {
        if (request.type() == ChallengeQuestionType.MULTIPLE_CHOICE) {
            List<ChallengeChoiceRequest> choices = Optional.ofNullable(request.choices()).orElse(List.of()).stream()
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

    private ChallengeAttemptResultResponse toAttemptResult(ChallengeAttempt attempt, List<ChallengeAnswer> answers, boolean revealCorrect) {
        List<ChallengeAnswerResultResponse> answerResults = answers.stream()
                .map(answer -> {
                    ChallengeQuestion question = answer.getQuestion();
                    ChallengeChoice selected = answer.getChoice();
                    List<ChallengeChoice> choices = question.getType() == ChallengeQuestionType.MULTIPLE_CHOICE
                            ? choiceRepository.findByQuestionIdOrderBySortOrderAsc(question.getId())
                            : List.of();
                    ChallengeChoice correct = choices.stream()
                            .filter(choice -> Boolean.TRUE.equals(choice.getIsCorrect()))
                            .findFirst()
                            .orElse(null);
                    return new ChallengeAnswerResultResponse(
                            question.getId(),
                            question.getTitle(),
                            question.getPrompt(),
                            question.getType(),
                            question.getPoints(),
                            choices.stream()
                                    .map(choice -> ChallengeChoiceResponse.from(choice, revealCorrect))
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
        return new ChallengeAttemptResultResponse(
                attempt.getId(),
                attempt.getChallenge().getId(),
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
                answerResults);
    }

    private ChallengeQuestionSet createDefaultQuestionSet(Challenge challenge) {
        ChallengeQuestionSet questionSet = new ChallengeQuestionSet();
        questionSet.setChallenge(challenge);
        questionSet.setTitle("Tap cau hoi mac dinh");
        questionSet.setTimeLimitMinutes(challenge.getTimeLimitMinutes());
        questionSet.setSortOrder(0);
        return questionSetRepository.save(questionSet);
    }

    private ChallengeQuestionSet getOrCreateDefaultQuestionSet(Challenge challenge) {
        return questionSetRepository.findFirstByChallengeIdOrderBySortOrderAsc(challenge.getId())
                .orElseGet(() -> createDefaultQuestionSet(challenge));
    }

    private int normalizedMaxAttempts(Challenge challenge) {
        Integer maxAttempts = challenge.getMaxAttempts();
        return maxAttempts != null && maxAttempts > 0 ? maxAttempts : 1;
    }

    private void ensureAttemptWithinTimeLimit(ChallengeAttempt attempt) {
        ChallengeQuestionSet questionSet = attempt.getQuestionSet();
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
            ChallengeAttempt attempt,
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

    private Challenge findChallenge(UUID challengeId) {
        return challengeRepository.findById(challengeId)
                .orElseThrow(() -> new NotFoundException("Challenge not found: " + challengeId));
    }

    private ChallengeQuestionSet findQuestionSet(UUID questionSetId) {
        return questionSetRepository.findById(questionSetId)
                .orElseThrow(() -> new NotFoundException("Question set not found: " + questionSetId));
    }

    private ChallengeQuestion findQuestion(UUID questionId) {
        return questionRepository.findById(questionId)
                .orElseThrow(() -> new NotFoundException("Question not found: " + questionId));
    }

    private boolean canManage(Challenge challenge, UUID userId, String roles) {
        return RoleUtils.isAdmin(roles) || (RoleUtils.isInstructor(roles) && userId != null && challenge.getInstructorId().equals(userId));
    }

    private void requireCanManage(Challenge challenge, UUID userId, String roles) {
        if (!canManage(challenge, userId, roles)) {
            throw new ForbiddenException("Challenge owner or admin role required.");
        }
    }

    private void requireCanView(Challenge challenge, UUID userId, String roles) {
        if (challenge.getStatus() == ChallengeStatus.PUBLISHED || canManage(challenge, userId, roles)) {
            return;
        }
        throw new ForbiddenException("Challenge is not published.");
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
