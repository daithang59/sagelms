package dev.sagelms.course.service;

import dev.sagelms.course.dto.EnrollmentResponse;
import dev.sagelms.course.entity.Course;
import dev.sagelms.course.entity.Enrollment;
import dev.sagelms.course.entity.EnrollmentStatus;
import dev.sagelms.course.repository.CourseRepository;
import dev.sagelms.course.repository.EnrollmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for EnrollmentService
 * Test enrollment logic: enroll, unenroll, status changes
 */
@ExtendWith(MockitoExtension.class)
class EnrollmentServiceTest {

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private CourseRepository courseRepository;

    @InjectMocks
    private EnrollmentService enrollmentService;

    // Test data
    private UUID courseId;
    private UUID studentId;
    private Course testCourse;
    private Enrollment testEnrollment;

    @BeforeEach
    void setUp() {
        courseId = UUID.randomUUID();
        studentId = UUID.randomUUID();

        testCourse = new Course();
        testCourse.setId(courseId);
        testCourse.setTitle("Test Course");

        testEnrollment = new Enrollment();
        testEnrollment.setId(UUID.randomUUID());
        testEnrollment.setCourseId(courseId);
        testEnrollment.setStudentId(studentId);
        testEnrollment.setStatus(EnrollmentStatus.ACTIVE);
    }

    // ============== ENROLL TESTS ==============

    @Test
    void enrollStudent_Success() {
        // Arrange
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(testCourse));
        when(enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)).thenReturn(false);
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(invocation -> {
            Enrollment saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        // Act
        EnrollmentResponse response = enrollmentService.enrollStudent(courseId, studentId);

        // Assert
        assertNotNull(response);
        assertEquals(courseId, response.courseId());
        assertEquals(studentId, response.studentId());
        assertEquals(EnrollmentStatus.ACTIVE, response.status());
        verify(enrollmentRepository, times(1)).save(any(Enrollment.class));
    }

    @Test
    void enrollStudent_CourseNotFound_ThrowsException() {
        // Arrange
        when(courseRepository.findById(courseId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(EnrollmentService.CourseNotFoundException.class, () ->
            enrollmentService.enrollStudent(courseId, studentId)
        );
    }

    @Test
    void enrollStudent_AlreadyEnrolled_ThrowsException() {
        // Arrange
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(testCourse));
        when(enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)).thenReturn(true);

        // Act & Assert
        assertThrows(EnrollmentService.AlreadyEnrolledException.class, () ->
            enrollmentService.enrollStudent(courseId, studentId)
        );
    }

    // ============== UNENROLL TESTS ==============

    @Test
    void unenrollStudent_Success() {
        // Arrange
        when(enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId))
                .thenReturn(Optional.of(testEnrollment));
        when(enrollmentRepository.save(any(Enrollment.class))).thenReturn(testEnrollment);

        // Act
        enrollmentService.unenrollStudent(courseId, studentId);

        // Assert
        assertEquals(EnrollmentStatus.DROPPED, testEnrollment.getStatus());
        verify(enrollmentRepository, times(1)).save(testEnrollment);
    }

    @Test
    void unenrollStudent_NotEnrolled_ThrowsException() {
        // Arrange
        when(enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(EnrollmentService.EnrollmentNotFoundException.class, () ->
            enrollmentService.unenrollStudent(courseId, studentId)
        );
    }

    // ============== COMPLETE COURSE TESTS ==============

    @Test
    void completeCourse_Success() {
        // Arrange
        when(enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId))
                .thenReturn(Optional.of(testEnrollment));
        when(enrollmentRepository.save(any(Enrollment.class))).thenReturn(testEnrollment);
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(testCourse));

        // Act
        EnrollmentResponse response = enrollmentService.completeCourse(courseId, studentId);

        // Assert
        assertEquals(EnrollmentStatus.COMPLETED, response.status());
    }

    @Test
    void completeCourse_NotEnrolled_ThrowsException() {
        // Arrange
        when(enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(EnrollmentService.EnrollmentNotFoundException.class, () ->
            enrollmentService.completeCourse(courseId, studentId)
        );
    }

    // ============== CHECK ENROLLMENT TESTS ==============

    @Test
    void isEnrolled_True() {
        // Arrange
        when(enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)).thenReturn(true);

        // Act
        boolean result = enrollmentService.isEnrolled(studentId, courseId);

        // Assert
        assertTrue(result);
    }

    @Test
    void isEnrolled_False() {
        // Arrange
        when(enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)).thenReturn(false);

        // Act
        boolean result = enrollmentService.isEnrolled(studentId, courseId);

        // Assert
        assertFalse(result);
    }
}
