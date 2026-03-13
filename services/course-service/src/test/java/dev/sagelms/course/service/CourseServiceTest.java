package dev.sagelms.course.service;

import dev.sagelms.course.dto.CourseRequest;
import dev.sagelms.course.dto.CourseResponse;
import dev.sagelms.course.entity.Course;
import dev.sagelms.course.entity.CourseStatus;
import dev.sagelms.course.repository.CourseRepository;
import dev.sagelms.course.repository.EnrollmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CourseService
 * Test all business logic: CRUD, ownership, enrollment counting
 */
@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @InjectMocks
    private CourseService courseService;

    // Test data
    private UUID instructorId;
    private UUID courseId;
    private Course testCourse;

    @BeforeEach
    void setUp() {
        instructorId = UUID.randomUUID();
        courseId = UUID.randomUUID();

        testCourse = new Course();
        testCourse.setId(courseId);
        testCourse.setTitle("Test Course");
        testCourse.setDescription("Test Description");
        testCourse.setInstructorId(instructorId);
        testCourse.setStatus(CourseStatus.DRAFT);
        testCourse.setCategory("Programming");
    }

    // ============== CREATE TESTS ==============

    @Test
    void createCourse_Success() {
        // Arrange
        CourseRequest request = new CourseRequest(
                "Java Basics",
                "Learn Java",
                "https://img.com/thumb.jpg",
                CourseStatus.DRAFT,
                "Programming"
        );

        when(courseRepository.save(any(Course.class))).thenAnswer(invocation -> {
            Course saved = invocation.getArgument(0);
            saved.setId(courseId);
            return saved;
        });

        // Act
        CourseResponse response = courseService.createCourse(request, instructorId);

        // Assert
        assertNotNull(response);
        assertEquals("Java Basics", response.title());
        assertEquals(instructorId, response.instructorId());
        assertEquals(CourseStatus.DRAFT, response.status());
        assertEquals(0, response.enrollmentCount());
        verify(courseRepository, times(1)).save(any(Course.class));
    }

    @Test
    void createCourse_WithNullStatus_DefaultsToDraft() {
        // Arrange
        CourseRequest request = new CourseRequest(
                "Java Course",
                "Description",
                null,
                null, // null status
                "Programming"
        );

        when(courseRepository.save(any(Course.class))).thenAnswer(invocation -> {
            Course saved = invocation.getArgument(0);
            saved.setId(courseId);
            return saved;
        });

        // Act
        CourseResponse response = courseService.createCourse(request, instructorId);

        // Assert
        assertEquals(CourseStatus.DRAFT, response.status());
    }

    // ============== UPDATE TESTS ==============

    @Test
    void updateCourse_Success() {
        // Arrange
        CourseRequest request = new CourseRequest(
                "Updated Title",
                "Updated Description",
                null,
                CourseStatus.PUBLISHED,
                "Updated Category"
        );

        when(courseRepository.findById(courseId)).thenReturn(Optional.of(testCourse));
        when(courseRepository.save(any(Course.class))).thenReturn(testCourse);
        when(courseRepository.countEnrollments(courseId)).thenReturn(5L);

        // Act
        CourseResponse response = courseService.updateCourse(courseId, request, instructorId);

        // Assert
        assertNotNull(response);
        verify(courseRepository).save(any(Course.class));
    }

    @Test
    void updateCourse_NotOwner_ThrowsException() {
        // Arrange
        UUID otherInstructorId = UUID.randomUUID();
        CourseRequest request = new CourseRequest(
                "Hacked Title",
                "Description",
                null,
                CourseStatus.PUBLISHED,
                "Category"
        );

        when(courseRepository.findById(courseId)).thenReturn(Optional.of(testCourse));

        // Act & Assert
        assertThrows(CourseService.CourseOwnershipException.class, () ->
            courseService.updateCourse(courseId, request, otherInstructorId)
        );
    }

    @Test
    void updateCourse_NotFound_ThrowsException() {
        // Arrange
        UUID notFoundId = UUID.randomUUID();
        CourseRequest request = new CourseRequest(
                "Title",
                "Description",
                null,
                CourseStatus.DRAFT,
                "Category"
        );

        when(courseRepository.findById(notFoundId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(CourseService.CourseNotFoundException.class, () ->
            courseService.updateCourse(notFoundId, request, instructorId)
        );
    }

    // ============== DELETE TESTS ==============

    @Test
    void deleteCourse_Success() {
        // Arrange
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(testCourse));
        doNothing().when(courseRepository).delete(testCourse);

        // Act
        courseService.deleteCourse(courseId, instructorId);

        // Assert
        verify(courseRepository, times(1)).delete(testCourse);
    }

    @Test
    void deleteCourse_NotOwner_ThrowsException() {
        // Arrange
        UUID otherInstructorId = UUID.randomUUID();
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(testCourse));

        // Act & Assert
        assertThrows(CourseService.CourseOwnershipException.class, () ->
            courseService.deleteCourse(courseId, otherInstructorId)
        );
    }

    // ============== READ TESTS ==============

    @Test
    void getCourseById_Success() {
        // Arrange
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(testCourse));
        when(courseRepository.countEnrollments(courseId)).thenReturn(10L);

        // Act
        CourseResponse response = courseService.getCourseById(courseId);

        // Assert
        assertNotNull(response);
        assertEquals(courseId, response.id());
        assertEquals(10, response.enrollmentCount());
    }

    @Test
    void getCourseById_NotFound_ThrowsException() {
        // Arrange
        UUID notFoundId = UUID.randomUUID();
        when(courseRepository.findById(notFoundId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(CourseService.CourseNotFoundException.class, () ->
            courseService.getCourseById(notFoundId)
        );
    }

    @Test
    void getCoursesByInstructor_Success() {
        // Arrange
        List<Course> courses = List.of(testCourse);
        when(courseRepository.findByInstructorId(instructorId)).thenReturn(courses);
        when(enrollmentRepository.countEnrollmentsByCourseIdsMap(anyList()))
                .thenReturn(Map.of(courseId, 3L));

        // Act
        List<CourseResponse> responses = courseService.getCoursesByInstructor(instructorId);

        // Assert
        assertEquals(1, responses.size());
        assertEquals(3, responses.get(0).enrollmentCount());
    }

    // ============== PAGINATION TESTS ==============

    @Test
    void getAllCourses_Pageable_ReturnsPagedResults() {
        // Arrange
        List<Course> courses = List.of(testCourse);
        org.springframework.data.domain.Page<Course> page =
            new org.springframework.data.domain.PageImpl<>(courses);

        when(courseRepository.findAll(any(org.springframework.data.domain.Pageable.class))).thenReturn(page);
        when(enrollmentRepository.countEnrollmentsByCourseIdsMap(anyList()))
                .thenReturn(Map.of(courseId, 0L));

        // Act
        org.springframework.data.domain.Page<CourseResponse> result =
            courseService.getAllCourses(org.springframework.data.domain.PageRequest.of(0, 10));

        // Assert
        assertEquals(1, result.getTotalElements());
    }

    // ============== EDGE CASES ==============

    @Test
    void getAllCourses_EmptyList_ReturnsEmptyPage() {
        // Arrange
        org.springframework.data.domain.Page<Course> emptyPage =
            new org.springframework.data.domain.PageImpl<>(List.of());

        when(courseRepository.findAll(any(org.springframework.data.domain.Pageable.class))).thenReturn(emptyPage);
        when(enrollmentRepository.countEnrollmentsByCourseIdsMap(anyList()))
                .thenReturn(Map.of());

        // Act
        org.springframework.data.domain.Page<CourseResponse> result =
            courseService.getAllCourses(org.springframework.data.domain.PageRequest.of(0, 10));

        // Assert
        assertEquals(0, result.getTotalElements());
    }

    @Test
    void createCourse_NullInstructorId_HandlesGracefully() {
        // Arrange - instructorId can be null in some cases
        UUID nullInstructorId = null;
        CourseRequest request = new CourseRequest(
                "Title",
                "Description",
                null,
                CourseStatus.DRAFT,
                "Category"
        );

        when(courseRepository.save(any(Course.class))).thenAnswer(invocation -> {
            Course saved = invocation.getArgument(0);
            saved.setId(courseId);
            return saved;
        });

        // Act & Assert - should not throw
        CourseResponse response = courseService.createCourse(request, nullInstructorId);
        assertNotNull(response);
    }
}
