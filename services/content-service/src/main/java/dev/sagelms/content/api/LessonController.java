package dev.sagelms.content.api;

import dev.sagelms.content.dto.LessonRequest;
import dev.sagelms.content.dto.LessonResponse;
import dev.sagelms.content.service.LessonService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Lesson operations
 */
@RestController
@RequestMapping("/api/v1")
public class LessonController {

    private final LessonService lessonService;

    public LessonController(LessonService lessonService) {
        this.lessonService = lessonService;
    }

    /**
     * GET /api/v1/courses/{courseId}/lessons - Get all lessons for a course
     */
    @GetMapping("/courses/{courseId}/lessons")
    public ResponseEntity<List<LessonResponse>> getLessonsByCourse(
            @PathVariable UUID courseId,
            @RequestParam(value = "published", defaultValue = "false") boolean publishedOnly
    ) {
        if (publishedOnly) {
            return ResponseEntity.ok(lessonService.getPublishedLessonsByCourse(courseId));
        }
        return ResponseEntity.ok(lessonService.getLessonsByCourse(courseId));
    }

    /**
     * GET /api/v1/lessons/{id} - Get lesson by ID
     */
    @GetMapping("/lessons/{id}")
    public ResponseEntity<LessonResponse> getLessonById(@PathVariable UUID id) {
        return ResponseEntity.ok(lessonService.getLessonById(id));
    }

    /**
     * POST /api/v1/courses/{courseId}/lessons - Create a new lesson
     * Requires X-User-Id header for ownership tracking
     */
    @PostMapping("/courses/{courseId}/lessons")
    public ResponseEntity<LessonResponse> createLesson(
            @PathVariable UUID courseId,
            @Valid @RequestBody LessonRequest request,
            @RequestHeader("X-User-Id") UUID userId
    ) {
        LessonResponse created = lessonService.createLesson(courseId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/v1/lessons/{id} - Update a lesson
     * Requires X-User-Id header for ownership verification
     */
    @PutMapping("/lessons/{id}")
    public ResponseEntity<LessonResponse> updateLesson(
            @PathVariable UUID id,
            @Valid @RequestBody LessonRequest request,
            @RequestHeader("X-User-Id") UUID userId
    ) {
        return ResponseEntity.ok(lessonService.updateLesson(id, request, userId));
    }

    /**
     * DELETE /api/v1/lessons/{id} - Delete a lesson
     * Requires X-User-Id header for ownership verification
     */
    @DeleteMapping("/lessons/{id}")
    public ResponseEntity<Void> deleteLesson(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID userId
    ) {
        lessonService.deleteLesson(id, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * PUT /api/v1/courses/{courseId}/lessons/reorder - Reorder lessons
     * Requires X-User-Id header for ownership verification
     */
    @PutMapping("/courses/{courseId}/lessons/reorder")
    public ResponseEntity<Void> reorderLessons(
            @PathVariable UUID courseId,
            @RequestBody List<UUID> lessonIds,
            @RequestHeader("X-User-Id") UUID userId
    ) {
        lessonService.reorderLessons(courseId, lessonIds, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * PATCH /api/v1/lessons/{id}/publish - Publish/unpublish a lesson
     * Requires X-User-Id header for ownership verification
     */
    @PatchMapping("/lessons/{id}/publish")
    public ResponseEntity<LessonResponse> togglePublish(
            @PathVariable UUID id,
            @RequestParam boolean publish,
            @RequestHeader("X-User-Id") UUID userId
    ) {
        return ResponseEntity.ok(lessonService.publishLesson(id, publish, userId));
    }
}
