package dev.sagelms.assessment.repository;

import dev.sagelms.assessment.entity.Assessment;
import dev.sagelms.assessment.entity.AssessmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface AssessmentRepository extends JpaRepository<Assessment, UUID> {
    Page<Assessment> findByStatus(AssessmentStatus status, Pageable pageable);

    Page<Assessment> findByCourseId(UUID courseId, Pageable pageable);

    Page<Assessment> findByCourseIdAndStatus(UUID courseId, AssessmentStatus status, Pageable pageable);

    @Query("""
        select c from Assessment c
        where c.courseId = :courseId
          and (:category is null or lower(c.category) = :category)
          and (:search is null or :search = ''
           or lower(c.title) like concat('%', :search, '%')
           or lower(coalesce(c.description, '')) like concat('%', :search, '%')
           or lower(coalesce(c.category, '')) like concat('%', :search, '%'))
        """)
    Page<Assessment> findAllFiltered(
            @Param("courseId") UUID courseId,
            @Param("search") String search,
            @Param("category") String category,
            Pageable pageable);

    @Query("""
        select c from Assessment c
        where c.courseId = :courseId
          and c.status = dev.sagelms.assessment.entity.AssessmentStatus.PUBLISHED
          and (:category is null or lower(c.category) = :category)
          and (:search is null or :search = ''
           or lower(c.title) like concat('%', :search, '%')
           or lower(coalesce(c.description, '')) like concat('%', :search, '%')
           or lower(coalesce(c.category, '')) like concat('%', :search, '%'))
        """)
    Page<Assessment> findPublishedFiltered(
            @Param("courseId") UUID courseId,
            @Param("search") String search,
            @Param("category") String category,
            Pageable pageable);

    @Query("""
        select c from Assessment c
        where c.courseId = :courseId
          and (c.status = dev.sagelms.assessment.entity.AssessmentStatus.PUBLISHED
           or c.instructorId = :viewerId)
          and (:category is null or lower(c.category) = :category)
          and (:search is null or :search = ''
           or lower(c.title) like concat('%', :search, '%')
           or lower(coalesce(c.description, '')) like concat('%', :search, '%')
           or lower(coalesce(c.category, '')) like concat('%', :search, '%'))
        """)
    Page<Assessment> findVisibleToInstructorFiltered(
            @Param("courseId") UUID courseId,
            @Param("viewerId") UUID viewerId,
            @Param("search") String search,
            @Param("category") String category,
            Pageable pageable);

    @Query("""
        select c from Assessment c
        where lower(c.title) like concat('%', :search, '%')
           or lower(coalesce(c.description, '')) like concat('%', :search, '%')
           or lower(coalesce(c.category, '')) like concat('%', :search, '%')
        """)
    Page<Assessment> search(String search, Pageable pageable);

    @Query("""
        select c from Assessment c
        where c.status = dev.sagelms.assessment.entity.AssessmentStatus.PUBLISHED
          and (lower(c.title) like concat('%', :search, '%')
           or lower(coalesce(c.description, '')) like concat('%', :search, '%')
           or lower(coalesce(c.category, '')) like concat('%', :search, '%'))
        """)
    Page<Assessment> searchPublished(String search, Pageable pageable);

    @Query("""
        select c from Assessment c
        where c.status = dev.sagelms.assessment.entity.AssessmentStatus.PUBLISHED
           or c.instructorId = :viewerId
        """)
    Page<Assessment> findVisibleToInstructor(@Param("viewerId") UUID viewerId, Pageable pageable);

    @Query("""
        select c from Assessment c
        where (c.status = dev.sagelms.assessment.entity.AssessmentStatus.PUBLISHED
           or c.instructorId = :viewerId)
          and (lower(c.title) like concat('%', :search, '%')
           or lower(coalesce(c.description, '')) like concat('%', :search, '%')
           or lower(coalesce(c.category, '')) like concat('%', :search, '%'))
        """)
    Page<Assessment> searchVisibleToInstructor(
            @Param("viewerId") UUID viewerId,
            @Param("search") String search,
            Pageable pageable);
}


