package dev.sagelms.course.repository;

import dev.sagelms.course.entity.Enrollment;
import dev.sagelms.course.entity.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {

    // Find enrollments by student
    List<Enrollment> findByStudentId(UUID studentId);

    // Find enrollments by course
    List<Enrollment> findByCourseId(UUID courseId);

    // Find enrollment by student and course (for checking if enrolled)
    Optional<Enrollment> findByStudentIdAndCourseId(UUID studentId, UUID courseId);

    // Find enrollments by student and status
    List<Enrollment> findByStudentIdAndStatus(UUID studentId, EnrollmentStatus status);

    // Find enrollments by course and status
    List<Enrollment> findByCourseIdAndStatus(UUID courseId, EnrollmentStatus status);

    // Check if student is enrolled in course (any status)
    boolean existsByStudentIdAndCourseId(UUID studentId, UUID courseId);

    // Check if student is ACTIVELY enrolled in course
    boolean existsByStudentIdAndCourseIdAndStatus(UUID studentId, UUID courseId, EnrollmentStatus status);

    // Count students enrolled in a course
    long countByCourseId(UUID courseId);

    // Get active enrollments for a student
    @Query("SELECT e FROM Enrollment e WHERE e.studentId = :studentId AND e.status = 'ACTIVE'")
    List<Enrollment> findActiveEnrollmentsByStudentId(@Param("studentId") UUID studentId);

    // Bulk count enrollments for multiple courses (avoid N+1 problem)
    @Query("SELECT e.courseId, COUNT(e) FROM Enrollment e WHERE e.courseId IN :courseIds GROUP BY e.courseId")
    List<Object[]> countEnrollmentsByCourseIds(@Param("courseIds") List<UUID> courseIds);

    /**
     * Helper method to get enrollment counts as Map
     */
    default Map<UUID, Long> countEnrollmentsByCourseIdsMap(List<UUID> courseIds) {
        if (courseIds == null || courseIds.isEmpty()) {
            return Map.of();
        }
        return countEnrollmentsByCourseIds(courseIds).stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]
                ));
    }
}
