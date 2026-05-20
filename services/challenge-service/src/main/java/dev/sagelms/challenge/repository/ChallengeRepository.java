package dev.sagelms.challenge.repository;

import dev.sagelms.challenge.entity.Challenge;
import dev.sagelms.challenge.entity.ChallengeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ChallengeRepository extends JpaRepository<Challenge, UUID> {
    Page<Challenge> findByStatus(ChallengeStatus status, Pageable pageable);

    @Query("""
            select c from Challenge c
            where (:hasCategory = false or lower(c.category) = :category)
              and (:hasSearch = false
               or lower(c.title) like :searchPattern
               or lower(coalesce(c.description, '')) like :searchPattern
               or lower(coalesce(c.category, '')) like :searchPattern)
            """)
    Page<Challenge> findAllFiltered(
            @Param("hasSearch") boolean hasSearch,
            @Param("searchPattern") String searchPattern,
            @Param("hasCategory") boolean hasCategory,
            @Param("category") String category,
            Pageable pageable);

    @Query("""
            select c from Challenge c
            where c.status = dev.sagelms.challenge.entity.ChallengeStatus.PUBLISHED
              and (:hasCategory = false or lower(c.category) = :category)
              and (:hasSearch = false
               or lower(c.title) like :searchPattern
               or lower(coalesce(c.description, '')) like :searchPattern
               or lower(coalesce(c.category, '')) like :searchPattern)
            """)
    Page<Challenge> findPublishedFiltered(
            @Param("hasSearch") boolean hasSearch,
            @Param("searchPattern") String searchPattern,
            @Param("hasCategory") boolean hasCategory,
            @Param("category") String category,
            Pageable pageable);

    @Query("""
            select c from Challenge c
            where (c.status = dev.sagelms.challenge.entity.ChallengeStatus.PUBLISHED
               or c.instructorId = :viewerId)
              and (:hasCategory = false or lower(c.category) = :category)
              and (:hasSearch = false
               or lower(c.title) like :searchPattern
               or lower(coalesce(c.description, '')) like :searchPattern
               or lower(coalesce(c.category, '')) like :searchPattern)
            """)
    Page<Challenge> findVisibleToInstructorFiltered(
            @Param("viewerId") UUID viewerId,
            @Param("hasSearch") boolean hasSearch,
            @Param("searchPattern") String searchPattern,
            @Param("hasCategory") boolean hasCategory,
            @Param("category") String category,
            Pageable pageable);

    @Query("""
            select c from Challenge c
            where lower(c.title) like concat('%', :search, '%')
               or lower(coalesce(c.description, '')) like concat('%', :search, '%')
               or lower(coalesce(c.category, '')) like concat('%', :search, '%')
            """)
    Page<Challenge> search(String search, Pageable pageable);

    @Query("""
            select c from Challenge c
            where c.status = dev.sagelms.challenge.entity.ChallengeStatus.PUBLISHED
              and (lower(c.title) like concat('%', :search, '%')
               or lower(coalesce(c.description, '')) like concat('%', :search, '%')
               or lower(coalesce(c.category, '')) like concat('%', :search, '%'))
            """)
    Page<Challenge> searchPublished(String search, Pageable pageable);

    @Query("""
            select c from Challenge c
            where c.status = dev.sagelms.challenge.entity.ChallengeStatus.PUBLISHED
               or c.instructorId = :viewerId
            """)
    Page<Challenge> findVisibleToInstructor(@Param("viewerId") UUID viewerId, Pageable pageable);

    @Query("""
            select c from Challenge c
            where (c.status = dev.sagelms.challenge.entity.ChallengeStatus.PUBLISHED
               or c.instructorId = :viewerId)
              and (lower(c.title) like concat('%', :search, '%')
               or lower(coalesce(c.description, '')) like concat('%', :search, '%')
               or lower(coalesce(c.category, '')) like concat('%', :search, '%'))
            """)
    Page<Challenge> searchVisibleToInstructor(
            @Param("viewerId") UUID viewerId,
            @Param("search") String search,
            Pageable pageable);
}
