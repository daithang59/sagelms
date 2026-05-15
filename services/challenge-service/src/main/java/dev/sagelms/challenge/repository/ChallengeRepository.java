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
        where lower(c.title) like lower(concat('%', :search, '%'))
           or lower(coalesce(c.description, '')) like lower(concat('%', :search, '%'))
           or lower(coalesce(c.category, '')) like lower(concat('%', :search, '%'))
        """)
    Page<Challenge> search(String search, Pageable pageable);

    @Query("""
        select c from Challenge c
        where c.status = dev.sagelms.challenge.entity.ChallengeStatus.PUBLISHED
          and (lower(c.title) like lower(concat('%', :search, '%'))
           or lower(coalesce(c.description, '')) like lower(concat('%', :search, '%'))
           or lower(coalesce(c.category, '')) like lower(concat('%', :search, '%')))
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
          and (lower(c.title) like lower(concat('%', :search, '%'))
           or lower(coalesce(c.description, '')) like lower(concat('%', :search, '%'))
           or lower(coalesce(c.category, '')) like lower(concat('%', :search, '%')))
        """)
    Page<Challenge> searchVisibleToInstructor(
            @Param("viewerId") UUID viewerId,
            @Param("search") String search,
            Pageable pageable);
}
