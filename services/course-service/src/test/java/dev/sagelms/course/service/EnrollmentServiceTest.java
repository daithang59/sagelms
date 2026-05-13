package dev.sagelms.course.service;

import dev.sagelms.course.dto.EnrollmentResponse;
import dev.sagelms.course.entity.Course;
import dev.sagelms.course.entity.Enrollment;
import dev.sagelms.course.entity.EnrollmentPolicy;
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

    @Mock
    private AuthUserClient authUserClient;

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
        testCourse.setInstructorId(UUID.randomUUID());

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
        when(enrollmentRepository.existsByStudentIdAndCourseIdAndStatus(studentId, courseId, EnrollmentStatus.ACTIVE)).thenReturn(false);
        when(enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)).thenReturn(Optional.empty());
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(invocation -> {
            Enrollment saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        // Act
        EnrollmentResponse response = enrollmentService.enrollStudent(courseId, studentId, "STUDENT");

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
        when(enrollmentRepository.existsByStudentIdAndCourseIdAndStatus(studentId, courseId, EnrollmentStatus.ACTIVE)).thenReturn(true);

        // Act & Assert
        assertThrows(EnrollmentService.AlreadyEnrolledException.class, () ->
            enrollmentService.enrollStudent(courseId, studentId, "STUDENT")
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
        enrollmentService.unenrollStudent(courseId, studentId, "STUDENT");

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
        EnrollmentResponse response = enrollmentService.completeCourse(courseId, studentId, "STUDENT");

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
        when(enrollmentRepository.existsByStudentIdAndCourseIdAndStatus(studentId, courseId, EnrollmentStatus.ACTIVE)).thenReturn(true);

        // Act
        boolean result = enrollmentService.isEnrolled(studentId, courseId);

        // Assert
        assertTrue(result);
    }

    @Test
    void isEnrolled_False() {
        // Arrange
        when(enrollmentRepository.existsByStudentIdAndCourseIdAndStatus(studentId, courseId, EnrollmentStatus.ACTIVE)).thenReturn(false);

        // Act
        boolean result = enrollmentService.isEnrolled(studentId, courseId);

        // Assert
        assertFalse(result);
    }

    @Test
    void enrollStudent_InstructorRoleCanEnrollOtherCourse() {
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(testCourse));
        when(enrollmentRepository.existsByStudentIdAndCourseIdAndStatus(studentId, courseId, EnrollmentStatus.ACTIVE)).thenReturn(false);
        when(enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)).thenReturn(Optional.empty());
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(invocation -> {
            Enrollment saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        EnrollmentResponse response = enrollmentService.enrollStudent(courseId, studentId, "INSTRUCTOR");

        assertEquals(studentId, response.studentId());
        assertEquals(EnrollmentStatus.ACTIVE, response.status());
    }

    @Test
    void enrollStudent_ApprovalRequiredCourseCreatesPendingRequest() {
        testCourse.setEnrollmentPolicy(EnrollmentPolicy.APPROVAL_REQUIRED);
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(testCourse));
        when(enrollmentRepository.existsByStudentIdAndCourseIdAndStatus(studentId, courseId, EnrollmentStatus.ACTIVE)).thenReturn(false);
        when(enrollmentRepository.existsByStudentIdAndCourseIdAndStatus(studentId, courseId, EnrollmentStatus.PENDING)).thenReturn(false);
        when(enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)).thenReturn(Optional.empty());
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(invocation -> {
            Enrollment saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        EnrollmentResponse response = enrollmentService.enrollStudent(courseId, studentId, "STUDENT");

        assertEquals(studentId, response.studentId());
        assertEquals(EnrollmentStatus.PENDING, response.status());
    }

    @Test
    void enrollStudent_InstructorCannotEnrollOwnCourse() {
        UUID instructorId = UUID.randomUUID();
        testCourse.setInstructorId(instructorId);
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(testCourse));

        assertThrows(EnrollmentService.CourseForbiddenException.class, () ->
                enrollmentService.enrollStudent(courseId, instructorId, "INSTRUCTOR")
        );
        verify(enrollmentRepository, never()).save(any());
    }

    @Test
    void getEnrollmentsByCourse_NonOwnerInstructor_ThrowsException() {
        UUID courseOwnerId = UUID.randomUUID();
        UUID otherInstructorId = UUID.randomUUID();
        testCourse.setInstructorId(courseOwnerId);

        when(courseRepository.findById(courseId)).thenReturn(Optional.of(testCourse));

        assertThrows(EnrollmentService.CourseForbiddenException.class, () ->
                enrollmentService.getEnrollmentsByCourse(courseId, otherInstructorId, "INSTRUCTOR")
        );
    }

    @Test
    void getEnrollmentsByCourse_AdminCanView() {
        UUID courseOwnerId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();
        testCourse.setInstructorId(courseOwnerId);

        when(courseRepository.findById(courseId)).thenReturn(Optional.of(testCourse));
        when(enrollmentRepository.findByCourseId(courseId)).thenReturn(java.util.List.of(testEnrollment));

        assertEquals(1, enrollmentService.getEnrollmentsByCourse(courseId, adminId, "ADMIN").size());
    }

    @Test
    void dropParticipant_CourseOwnerCanDropLearner() {
        UUID courseOwnerId = UUID.randomUUID();
        testCourse.setInstructorId(courseOwnerId);

        when(courseRepository.findById(courseId)).thenReturn(Optional.of(testCourse));
        when(enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)).thenReturn(Optional.of(testEnrollment));

        enrollmentService.dropParticipant(courseId, studentId, courseOwnerId, "INSTRUCTOR", "No longer eligible");

        assertEquals(EnrollmentStatus.DROPPED, testEnrollment.getStatus());
        verify(enrollmentRepository).save(testEnrollment);
    }

    @Test
    void approveParticipant_CourseOwnerCanApprovePendingRequest() {
        UUID courseOwnerId = UUID.randomUUID();
        testCourse.setInstructorId(courseOwnerId);
        testEnrollment.setStatus(EnrollmentStatus.PENDING);

        when(courseRepository.findById(courseId)).thenReturn(Optional.of(testCourse));
        when(enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)).thenReturn(Optional.of(testEnrollment));
        when(enrollmentRepository.save(testEnrollment)).thenReturn(testEnrollment);

        EnrollmentResponse response = enrollmentService.approveParticipant(courseId, studentId, courseOwnerId, "INSTRUCTOR");

        assertEquals(EnrollmentStatus.ACTIVE, testEnrollment.getStatus());
        assertEquals(EnrollmentStatus.ACTIVE, response.status());
    }
}
