package dev.sagelms.content.repository;

import dev.sagelms.content.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, UUID> {

    // Find all lessons for a course (ordered by sort_order)
    List<Lesson> findByCourseIdAndIsDeletedFalseOrderBySortOrderAsc(UUID courseId);

    // Find published lessons for a course
    List<Lesson> findByCourseIdAndIsPublishedTrueAndIsDeletedFalseOrderBySortOrderAsc(UUID courseId);

    // Find lesson by course and sort order
    Optional<Lesson> findByCourseIdAndSortOrderAndIsDeletedFalse(UUID courseId, Integer sortOrder);

    Optional<Lesson> findByIdAndIsDeletedFalse(UUID id);

    // Get max sort order for a course
    @Query("SELECT COALESCE(MAX(l.sortOrder), -1) FROM Lesson l WHERE l.courseId = :courseId AND l.isDeleted = false")
    Integer getMaxSortOrder(@Param("courseId") UUID courseId);

    // Count lessons in a course
    long countByCourseIdAndIsDeletedFalse(UUID courseId);

    // Update sort orders for bulk reorder
    @Modifying
    @Query("UPDATE Lesson l SET l.sortOrder = :newOrder WHERE l.id = :lessonId")
    void updateSortOrder(@Param("lessonId") UUID lessonId, @Param("newOrder") Integer newOrder);

    // Find all lessons by course (including unpublished - for instructor)
    List<Lesson> findByCourseIdAndIsDeletedFalse(UUID courseId);
}
