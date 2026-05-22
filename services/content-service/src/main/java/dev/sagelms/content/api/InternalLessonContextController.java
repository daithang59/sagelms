package dev.sagelms.content.api;

import dev.sagelms.content.dto.LessonResponse;
import dev.sagelms.content.security.RoleUtils;
import dev.sagelms.content.service.LessonService;
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
@RequestMapping("/internal/courses")
public class InternalLessonContextController {

    private static final String INTERNAL_SECRET_HEADER = "X-Internal-Secret";

    private final LessonService lessonService;
    private final String internalSecret;

    public InternalLessonContextController(
            LessonService lessonService,
            @Value("${app.internal.secret:dev-internal-secret-change-me}") String internalSecret) {
        this.lessonService = lessonService;
        this.internalSecret = internalSecret;
    }

    @GetMapping("/{courseId}/ai-context/lessons")
    public ResponseEntity<List<LessonAiContextResponse>> getLessonsForAiContext(
            @PathVariable UUID courseId,
            @RequestParam UUID userId,
            @RequestParam(required = false) String roles,
            @RequestHeader(value = INTERNAL_SECRET_HEADER, required = false) String providedSecret) {
        if (!internalSecret.equals(providedSecret)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<LessonResponse> lessons = loadVisibleLessons(courseId, userId, roles);
        return ResponseEntity.ok(lessons.stream()
                .map(LessonAiContextResponse::from)
                .toList());
    }

    private List<LessonResponse> loadVisibleLessons(UUID courseId, UUID userId, String roles) {
        if (RoleUtils.isAdmin(roles) || RoleUtils.isInstructor(roles)) {
            try {
                return lessonService.getLessonsByCourseForManagement(courseId, userId, roles);
            } catch (RuntimeException ignored) {
                // Non-owner instructors can still read published lessons when course access allows it.
            }
        }
        return lessonService.getLessonsByCourse(courseId, userId, roles);
    }

    public record LessonAiContextResponse(
            UUID id,
            String title,
            String type,
            String contentUrl,
            String textContent,
            Integer sortOrder,
            Integer durationMinutes,
            Boolean isPublished
    ) {
        public static LessonAiContextResponse from(LessonResponse lesson) {
            return new LessonAiContextResponse(
                    lesson.id(),
                    lesson.title(),
                    lesson.type() != null ? lesson.type().name() : null,
                    lesson.contentUrl(),
                    lesson.textContent(),
                    lesson.sortOrder(),
                    lesson.durationMinutes(),
                    lesson.isPublished());
        }
    }
}
