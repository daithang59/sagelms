package dev.sagelms.content.service;

import dev.sagelms.content.dto.LessonRequest;
import dev.sagelms.content.dto.LessonResponse;
import dev.sagelms.content.entity.ContentType;
import dev.sagelms.content.entity.Lesson;
import dev.sagelms.content.repository.LessonRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service layer for Lesson operations
 */
@Service
@Transactional
public class LessonService {

    private final LessonRepository lessonRepository;

    public LessonService(LessonRepository lessonRepository) {
        this.lessonRepository = lessonRepository;
    }

    /**
     * Create a new lesson
     * @param courseId - course to add lesson to
     * @param request - lesson data
     * @param instructorId - the instructor creating the lesson (for ownership)
     */
    public LessonResponse createLesson(UUID courseId, LessonRequest request, UUID instructorId) {
        validateLessonContent(request.type(), request.contentUrl(), request.textContent());

        Lesson lesson = new Lesson();
        lesson.setCourseId(courseId);
        lesson.setInstructorId(instructorId);  // Track ownership
        lesson.setTitle(request.title());
        lesson.setType(request.type());
        lesson.setContentUrl(request.contentUrl());
        lesson.setTextContent(request.textContent());
        lesson.setDurationMinutes(request.durationMinutes());
        lesson.setIsPublished(request.isPublished() != null ? request.isPublished() : false);

        // Set sort order - auto increment if not provided
        if (request.sortOrder() != null) {
            lesson.setSortOrder(request.sortOrder());
        } else {
            Integer maxOrder = lessonRepository.getMaxSortOrder(courseId);
            lesson.setSortOrder(maxOrder + 1);
        }

        Lesson saved = lessonRepository.save(lesson);
        return LessonResponse.fromEntity(saved);
    }

    /**
     * Update an existing lesson
     * @param lessonId - lesson to update
     * @param request - new lesson data
     * @param instructorId - the instructor making the update (for ownership check)
     */
    public LessonResponse updateLesson(UUID lessonId, LessonRequest request, UUID instructorId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new LessonNotFoundException("Lesson not found: " + lessonId));

        // Ownership check - only the instructor who created the lesson can update it
        // Ownership check - only the instructor who created the lesson can update it
        if (!lesson.getInstructorId().equals(instructorId)) {
            throw new LessonOwnershipException("You do not have permission to update this lesson");
        }

        validateLessonContent(request.type(), request.contentUrl(), request.textContent());

        lesson.setTitle(request.title());
        lesson.setType(request.type());
        lesson.setContentUrl(request.contentUrl());
        lesson.setTextContent(request.textContent());
        lesson.setDurationMinutes(request.durationMinutes());
        if (request.isPublished() != null) {
            lesson.setIsPublished(request.isPublished());
        }

        if (request.sortOrder() != null) {
            lesson.setSortOrder(request.sortOrder());
        }

        Lesson updated = lessonRepository.save(lesson);
        return LessonResponse.fromEntity(updated);
    }

    /**
     * Delete a lesson
     * @param lessonId - lesson to delete
     * @param instructorId - the instructor deleting (for ownership check)
     */
    public void deleteLesson(UUID lessonId, UUID instructorId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new LessonNotFoundException("Lesson not found: " + lessonId));

        // Ownership check
        if (!lesson.getInstructorId().equals(instructorId)) {
            throw new LessonOwnershipException("You do not have permission to delete this lesson");
        }

        lessonRepository.delete(lesson);
    }

    /**
     * Get lesson by ID
     */
    @Transactional(readOnly = true)
    public LessonResponse getLessonById(UUID lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new LessonNotFoundException("Lesson not found: " + lessonId));
        return LessonResponse.fromEntity(lesson);
    }

    /**
     * Get all lessons for a course (including unpublished - for instructor)
     */
    @Transactional(readOnly = true)
    public List<LessonResponse> getLessonsByCourse(UUID courseId) {
        return lessonRepository.findByCourseIdOrderBySortOrderAsc(courseId).stream()
                .map(LessonResponse::fromEntity)
                .toList();
    }

    /**
     * Get published lessons for a course (for students)
     */
    @Transactional(readOnly = true)
    public List<LessonResponse> getPublishedLessonsByCourse(UUID courseId) {
        return lessonRepository.findByCourseIdAndIsPublishedTrueOrderBySortOrderAsc(courseId).stream()
                .map(LessonResponse::fromEntity)
                .toList();
    }

    /**
     * Reorder lessons in a course
     * @param courseId - course whose lessons to reorder
     * @param lessonIds - ordered list of lesson IDs
     * @param instructorId - the instructor making the change (for ownership)
     */
    public void reorderLessons(UUID courseId, List<UUID> lessonIds, UUID instructorId) {
        for (int i = 0; i < lessonIds.size(); i++) {
            UUID lessonId = lessonIds.get(i);
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new LessonNotFoundException("Lesson not found: " + lessonId));

            // Verify lesson belongs to course
            if (!lesson.getCourseId().equals(courseId)) {
                throw new IllegalArgumentException("Lesson " + lessonId + " does not belong to course " + courseId);
            }

            // Ownership check
            if (!lesson.getInstructorId().equals(instructorId)) {
                throw new LessonOwnershipException("You do not have permission to reorder this lesson");
            }

            lesson.setSortOrder(i);
            lessonRepository.save(lesson);
        }
    }

    /**
     * Publish/unpublish a lesson
     * @param lessonId - lesson to publish/unpublish
     * @param publish - true to publish, false to unpublish
     * @param instructorId - the instructor making the change (for ownership)
     */
    public LessonResponse publishLesson(UUID lessonId, boolean publish, UUID instructorId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new LessonNotFoundException("Lesson not found: " + lessonId));

        // Ownership check
        if (!lesson.getInstructorId().equals(instructorId)) {
            throw new LessonOwnershipException("You do not have permission to publish this lesson");
        }

        lesson.setIsPublished(publish);
        Lesson saved = lessonRepository.save(lesson);
        return LessonResponse.fromEntity(saved);
    }

    // ============== Validation ==============

    /**
     * Enforce business rule:
     * - TEXT type must have textContent
     * - VIDEO/PDF/LINK type must have contentUrl
     */
    private void validateLessonContent(ContentType type, String contentUrl, String textContent) {
        if (type == ContentType.TEXT) {
            if (textContent == null || textContent.isBlank()) {
                throw new IllegalArgumentException("textContent is required for TEXT lesson type");
            }
        } else {
            if (contentUrl == null || contentUrl.isBlank()) {
                throw new IllegalArgumentException("contentUrl is required for " + type + " lesson type");
            }
        }
    }

    // ============== Exception Classes ==============

    public static class LessonNotFoundException extends RuntimeException {
        public LessonNotFoundException(String message) {
            super(message);
        }
    }

    public static class LessonOwnershipException extends RuntimeException {
        public LessonOwnershipException(String message) {
            super(message);
        }
    }
}
