package dev.sagelms.course.repository;

import dev.sagelms.course.entity.Course;
import dev.sagelms.course.entity.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {

    // Find courses by instructor
    List<Course> findByInstructorId(UUID instructorId);

    // Find courses by status
    List<Course> findByStatus(CourseStatus status);

    // Paginated version
    Page<Course> findByStatus(CourseStatus status, Pageable pageable);

    // Find courses by instructor and status
    List<Course> findByInstructorIdAndStatus(UUID instructorId, CourseStatus status);

    // Search courses by title (case insensitive)
    @Query("SELECT c FROM Course c WHERE LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Course> searchByTitle(@Param("search") String search, Pageable pageable);

    // Find all published courses
    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED'")
    Page<Course> findPublishedCourses(Pageable pageable);

    // Find by category
    List<Course> findByCategory(String category);

    // Count enrollments for a course (using soft reference)
    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.courseId = :courseId")
    long countEnrollments(@Param("courseId") UUID courseId);
}
