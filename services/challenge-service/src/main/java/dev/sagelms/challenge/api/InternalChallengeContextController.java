package dev.sagelms.challenge.api;

import dev.sagelms.challenge.dto.ChallengeDetailResponse;
import dev.sagelms.challenge.dto.ChallengeQuestionResponse;
import dev.sagelms.challenge.dto.ChallengeQuestionSetDetailResponse;
import dev.sagelms.challenge.dto.ChallengeQuestionSetResponse;
import dev.sagelms.challenge.dto.ChallengeResponse;
import dev.sagelms.challenge.service.ChallengeService;
import org.springframework.beans.factory.annotation.Value;
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
@RequestMapping("/internal/challenges")
public class InternalChallengeContextController {

    private static final String INTERNAL_SECRET_HEADER = "X-Internal-Secret";

    private final ChallengeService challengeService;
    private final String internalSecret;

    public InternalChallengeContextController(
            ChallengeService challengeService,
            @Value("${app.internal.secret:sagelms-dev-internal-secret}") String internalSecret) {
        this.challengeService = challengeService;
        this.internalSecret = internalSecret;
    }

    @GetMapping("/{challengeId}/ai-context")
    public ResponseEntity<ChallengeAiContextResponse> getChallengeForAiContext(
            @PathVariable UUID challengeId,
            @RequestParam UUID userId,
            @RequestParam(required = false) String roles,
            @RequestHeader(value = INTERNAL_SECRET_HEADER, required = false) String providedSecret) {
        if (!internalSecret.equals(providedSecret)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        ChallengeDetailResponse detail = challengeService.getChallenge(challengeId, userId, roles);
        List<ChallengeQuestionSetAiContextResponse> questionSets = detail.questionSets().stream()
                .map(questionSet -> getQuestionSetDetail(questionSet, userId, roles))
                .toList();

        return ResponseEntity.ok(new ChallengeAiContextResponse(detail.challenge(), questionSets));
    }

    private ChallengeQuestionSetAiContextResponse getQuestionSetDetail(
            ChallengeQuestionSetResponse questionSet,
            UUID userId,
            String roles) {
        ChallengeQuestionSetDetailResponse detail = challengeService.getQuestionSet(questionSet.id(), userId, roles);
        return new ChallengeQuestionSetAiContextResponse(detail.questionSet(), detail.questions());
    }

    public record ChallengeAiContextResponse(
            ChallengeResponse challenge,
            List<ChallengeQuestionSetAiContextResponse> questionSets
    ) {}

    public record ChallengeQuestionSetAiContextResponse(
            ChallengeQuestionSetResponse questionSet,
            List<ChallengeQuestionResponse> questions
    ) {}
}
