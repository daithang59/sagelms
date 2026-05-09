package dev.sagelms.content.service;

import dev.sagelms.content.dto.LessonRequest;
import dev.sagelms.content.dto.LessonResponse;
import dev.sagelms.content.dto.LessonTextContentResponse;
import dev.sagelms.content.entity.ContentType;
import dev.sagelms.content.entity.Lesson;
import dev.sagelms.content.repository.LessonRepository;
import dev.sagelms.content.security.RoleUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Service layer for Lesson operations
 */
@Service
@Transactional
public class LessonService {

    private final LessonRepository lessonRepository;
    private final CourseOwnershipClient courseOwnershipClient;

    public LessonService(LessonRepository lessonRepository, CourseOwnershipClient courseOwnershipClient) {
        this.lessonRepository = lessonRepository;
        this.courseOwnershipClient = courseOwnershipClient;
    }

    /**
     * Create a new lesson
     * @param courseId - course to add lesson to
     * @param request - lesson data
     * @param instructorId - the instructor creating the lesson (for ownership)
     */
    public LessonResponse createLesson(UUID courseId, LessonRequest request, UUID instructorId) {
        return createLesson(courseId, request, instructorId, "INSTRUCTOR");
    }

    public LessonResponse createLesson(UUID courseId, LessonRequest request, UUID instructorId, String roles) {
        requireCourseManager(courseId, instructorId, roles);
        validateLessonContent(request.type(), request.contentUrl(), request.textContent());

        Lesson lesson = new Lesson();
        lesson.setCourseId(courseId);
        lesson.setInstructorId(instructorId);  // Track ownership
        lesson.setTitle(request.title());
        lesson.setType(request.type());
        lesson.setContentUrl(request.type() == ContentType.TEXT ? null : request.contentUrl());
        lesson.setTextContent(request.type() == ContentType.TEXT ? request.textContent() : null);
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
        return updateLesson(lessonId, request, instructorId, "INSTRUCTOR");
    }

    public LessonResponse updateLesson(UUID lessonId, LessonRequest request, UUID instructorId, String roles) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new LessonNotFoundException("Lesson not found: " + lessonId));

        requireCourseManager(lesson.getCourseId(), instructorId, roles);

        validateLessonContent(request.type(), request.contentUrl(), request.textContent());

        lesson.setTitle(request.title());
        lesson.setType(request.type());
        lesson.setContentUrl(request.type() == ContentType.TEXT ? null : request.contentUrl());
        lesson.setTextContent(request.type() == ContentType.TEXT ? request.textContent() : null);
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
        deleteLesson(lessonId, instructorId, "INSTRUCTOR");
    }

    public void deleteLesson(UUID lessonId, UUID instructorId, String roles) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new LessonNotFoundException("Lesson not found: " + lessonId));

        requireCourseManager(lesson.getCourseId(), instructorId, roles);

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

    @Transactional(readOnly = true)
    public LessonResponse getLessonById(UUID lessonId, UUID userId, String roles) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new LessonNotFoundException("Lesson not found: " + lessonId));
        if (!Boolean.TRUE.equals(lesson.getIsPublished())) {
            requireCourseManager(lesson.getCourseId(), userId, roles);
        } else {
            requireCourseContentAccess(lesson.getCourseId(), userId, roles);
        }
        return LessonResponse.fromEntity(lesson);
    }

    @Transactional(readOnly = true)
    public LessonTextContentResponse getLessonTextContent(UUID lessonId, UUID userId, String roles) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new LessonNotFoundException("Lesson not found: " + lessonId));
        if (!Boolean.TRUE.equals(lesson.getIsPublished())) {
            requireCourseManager(lesson.getCourseId(), userId, roles);
        } else {
            requireCourseContentAccess(lesson.getCourseId(), userId, roles);
        }
        return new LessonTextContentResponse(
                lesson.getId(),
                lesson.getCourseId(),
                lesson.getTitle(),
                lesson.getTextContent());
    }

    /**
     * Get all lessons for a course (including unpublished - for instructor)
     */
    @Transactional(readOnly = true)
    public List<LessonResponse> getLessonsByCourse(UUID courseId) {
        return getPublishedLessonsByCourse(courseId);
    }

    @Transactional(readOnly = true)
    public List<LessonResponse> getLessonsByCourse(UUID courseId, UUID userId, String roles) {
        requireCourseContentAccess(courseId, userId, roles);
        return getPublishedLessonsByCourse(courseId);
    }

    @Transactional(readOnly = true)
    public List<LessonResponse> getLessonsByCourseForManagement(UUID courseId, UUID userId, String roles) {
        requireCourseManager(courseId, userId, roles);
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
        reorderLessons(courseId, lessonIds, instructorId, "INSTRUCTOR");
    }

    public void reorderLessons(UUID courseId, List<UUID> lessonIds, UUID instructorId, String roles) {
        requireCourseManager(courseId, instructorId, roles);
        Set<UUID> uniqueLessonIds = new HashSet<>(lessonIds);
        if (uniqueLessonIds.size() != lessonIds.size()) {
            throw new IllegalArgumentException("lessonIds must not contain duplicates");
        }

        List<Lesson> lessons = lessonIds.stream()
                .map(lessonId -> lessonRepository.findById(lessonId)
                        .orElseThrow(() -> new LessonNotFoundException("Lesson not found: " + lessonId)))
                .toList();

        for (Lesson lesson : lessons) {
            if (!lesson.getCourseId().equals(courseId)) {
                throw new IllegalArgumentException("Lesson " + lesson.getId() + " does not belong to course " + courseId);
            }
        }

        for (int i = 0; i < lessonIds.size(); i++) {
            lessons.get(i).setSortOrder(-(i + 1));
            lessonRepository.save(lessons.get(i));
        }
        lessonRepository.flush();

        for (int i = 0; i < lessons.size(); i++) {
            lessons.get(i).setSortOrder(i);
            lessonRepository.save(lessons.get(i));
        }
    }

    /**
     * Publish/unpublish a lesson
     * @param lessonId - lesson to publish/unpublish
     * @param publish - true to publish, false to unpublish
     * @param instructorId - the instructor making the change (for ownership)
     */
    public LessonResponse publishLesson(UUID lessonId, boolean publish, UUID instructorId) {
        return publishLesson(lessonId, publish, instructorId, "INSTRUCTOR");
    }

    public LessonResponse publishLesson(UUID lessonId, boolean publish, UUID instructorId, String roles) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new LessonNotFoundException("Lesson not found: " + lessonId));

        requireCourseManager(lesson.getCourseId(), instructorId, roles);

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
        if (type == null) {
            throw new IllegalArgumentException("Content type is required");
        }
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

    private void requireCourseManager(UUID courseId, UUID userId, String roles) {
        if (RoleUtils.isAdmin(roles)) {
            return;
        }
        if (!RoleUtils.isInstructor(roles)) {
            throw new LessonOwnershipException("Instructor or admin role required");
        }
        if (userId == null || !courseOwnershipClient.isCourseOwner(courseId, userId)) {
            throw new LessonOwnershipException("You do not own this course");
        }
    }

    private void requireCourseContentAccess(UUID courseId, UUID userId, String roles) {
        if (!courseOwnershipClient.canAccessCourseContent(courseId, userId, roles)) {
            throw new LessonOwnershipException("You are not enrolled in this course");
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
