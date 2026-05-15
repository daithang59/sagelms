package dev.sagelms.challenge.service;

import dev.sagelms.challenge.dto.*;
import dev.sagelms.challenge.entity.*;
import dev.sagelms.challenge.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChallengeServiceTest {

    @Mock
    private ChallengeRepository challengeRepository;
    @Mock
    private ChallengeQuestionRepository questionRepository;
    @Mock
    private ChallengeChoiceRepository choiceRepository;
    @Mock
    private ChallengeAttemptRepository attemptRepository;
    @Mock
    private ChallengeAnswerRepository answerRepository;

    @InjectMocks
    private ChallengeService challengeService;

    private UUID instructorId;
    private UUID participantId;
    private UUID challengeId;

    @BeforeEach
    void setUp() {
        instructorId = UUID.randomUUID();
        participantId = UUID.randomUUID();
        challengeId = UUID.randomUUID();
    }

    @Test
    void createChallenge_Success() {
        ChallengeRequest request = new ChallengeRequest(
                "Java Challenge",
                "Compete globally",
                "https://example.com/thumb.jpg",
                "Programming",
                ChallengeStatus.DRAFT,
                45,
                new BigDecimal("60.00"),
                2);

        when(challengeRepository.save(any(Challenge.class))).thenAnswer(invocation -> {
            Challenge saved = invocation.getArgument(0);
            saved.setId(challengeId);
            return saved;
        });
        when(questionRepository.countByChallengeId(challengeId)).thenReturn(0L);

        ChallengeResponse response = challengeService.createChallenge(request, instructorId, "INSTRUCTOR");

        assertEquals("Java Challenge", response.title());
        assertEquals(instructorId, response.instructorId());
        assertEquals(ChallengeStatus.DRAFT, response.status());
    }

    @Test
    void addQuestion_MultipleChoiceNeedsExactlyOneCorrectChoice() {
        Challenge challenge = challenge();
        when(challengeRepository.findById(challengeId)).thenReturn(Optional.of(challenge));

        ChallengeQuestionRequest request = new ChallengeQuestionRequest(
                "Question",
                "Pick one",
                ChallengeQuestionType.MULTIPLE_CHOICE,
                QuestionMediaType.NONE,
                null,
                BigDecimal.ONE,
                0,
                List.of(
                        new ChallengeChoiceRequest("A", true, 0),
                        new ChallengeChoiceRequest("B", true, 1)));

        assertThrows(ChallengeService.ValidationException.class,
                () -> challengeService.addQuestion(challengeId, request, instructorId, "INSTRUCTOR"));
    }

    @Test
    void submitAttempt_GradesMultipleChoiceAndStoresEssayMetadata() {
        Challenge challenge = challenge();
        challenge.setStatus(ChallengeStatus.PUBLISHED);

        ChallengeQuestion mcq = question(challenge, ChallengeQuestionType.MULTIPLE_CHOICE, "Pick Java");
        ChallengeQuestion essay = question(challenge, ChallengeQuestionType.ESSAY, "Explain code");
        ChallengeChoice wrong = choice(mcq, "Python", false);
        ChallengeChoice correct = choice(mcq, "Java", true);
        ChallengeAttempt attempt = attempt(challenge);
        List<ChallengeAnswer> savedAnswers = new ArrayList<>();

        when(attemptRepository.findById(attempt.getId())).thenReturn(Optional.of(attempt));
        when(questionRepository.findByChallengeIdOrderBySortOrderAsc(challengeId)).thenReturn(List.of(mcq, essay));
        when(choiceRepository.findById(correct.getId())).thenReturn(Optional.of(correct));
        when(choiceRepository.findByQuestionIdOrderBySortOrderAsc(mcq.getId())).thenReturn(List.of(wrong, correct));
        when(answerRepository.save(any(ChallengeAnswer.class))).thenAnswer(invocation -> {
            ChallengeAnswer answer = invocation.getArgument(0);
            savedAnswers.add(answer);
            return answer;
        });
        when(attemptRepository.save(any(ChallengeAttempt.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(answerRepository.findByAttemptId(attempt.getId())).thenReturn(savedAnswers);

        ChallengeAttemptResultResponse result = challengeService.submitAttempt(
                attempt.getId(),
                new SubmitChallengeAttemptRequest(List.of(
                        new SubmitChallengeAnswerRequest(mcq.getId(), correct.getId(), null, null, null, null, null),
                        new SubmitChallengeAnswerRequest(essay.getId(), null, "My answer", "answer.zip", "application/zip", 1024L, "demo-local://answer.zip"))),
                participantId);

        assertEquals(0, new BigDecimal("1.00").compareTo(result.score()));
        assertEquals(0, new BigDecimal("1.00").compareTo(result.maxScore()));
        assertTrue(result.passed());
        assertEquals(2, result.answers().size());
        assertEquals("PENDING_REVIEW", result.answers().get(1).status());
        assertEquals("answer.zip", result.answers().get(1).fileName());
    }

    private Challenge challenge() {
        Challenge challenge = new Challenge();
        challenge.setId(challengeId);
        challenge.setTitle("Challenge");
        challenge.setInstructorId(instructorId);
        challenge.setStatus(ChallengeStatus.DRAFT);
        challenge.setPassScore(new BigDecimal("50.00"));
        challenge.setMaxAttempts(1);
        return challenge;
    }

    private ChallengeQuestion question(Challenge challenge, ChallengeQuestionType type, String prompt) {
        ChallengeQuestion question = new ChallengeQuestion();
        question.setId(UUID.randomUUID());
        question.setChallenge(challenge);
        question.setType(type);
        question.setPrompt(prompt);
        question.setPoints(BigDecimal.ONE);
        question.setSortOrder(0);
        return question;
    }

    private ChallengeChoice choice(ChallengeQuestion question, String text, boolean correct) {
        ChallengeChoice choice = new ChallengeChoice();
        choice.setId(UUID.randomUUID());
        choice.setQuestion(question);
        choice.setText(text);
        choice.setIsCorrect(correct);
        return choice;
    }

    private ChallengeAttempt attempt(Challenge challenge) {
        ChallengeAttempt attempt = new ChallengeAttempt();
        attempt.setId(UUID.randomUUID());
        attempt.setChallenge(challenge);
        attempt.setParticipantId(participantId);
        return attempt;
    }
}
