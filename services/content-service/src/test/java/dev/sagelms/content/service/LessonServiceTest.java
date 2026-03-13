package dev.sagelms.content.service;

import dev.sagelms.content.dto.LessonRequest;
import dev.sagelms.content.dto.LessonResponse;
import dev.sagelms.content.entity.ContentType;
import dev.sagelms.content.entity.Lesson;
import dev.sagelms.content.repository.LessonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for LessonService
 * Test lesson CRUD logic and ownership checks
 */
@ExtendWith(MockitoExtension.class)
class LessonServiceTest {

    @Mock
    private LessonRepository lessonRepository;

    @InjectMocks
    private LessonService lessonService;

    // Test data
    private UUID courseId;
    private UUID instructorId;
    private UUID lessonId;
    private Lesson testLesson;

    @BeforeEach
    void setUp() {
        courseId = UUID.randomUUID();
        instructorId = UUID.randomUUID();
        lessonId = UUID.randomUUID();

        testLesson = new Lesson();
        testLesson.setId(lessonId);
        testLesson.setCourseId(courseId);
        testLesson.setInstructorId(instructorId);
        testLesson.setTitle("Introduction to Java");
        testLesson.setType(ContentType.VIDEO);
        testLesson.setSortOrder(0);
        testLesson.setIsPublished(true);
    }

    // ============== CREATE TESTS ==============

    @Test
    void createLesson_Success() {
        // Arrange - instructorId comes from header, not from request body
        LessonRequest request = new LessonRequest(
                "New Lesson",
                ContentType.VIDEO,
                "https://video.com/1",
                null,
                null,
                30,
                true,
                null  // instructorId not needed in request body - comes from header
        );

        when(lessonRepository.getMaxSortOrder(courseId)).thenReturn(0);
        when(lessonRepository.save(any(Lesson.class))).thenAnswer(invocation -> {
            Lesson saved = invocation.getArgument(0);
            saved.setId(lessonId);
            return saved;
        });

        // Act
        LessonResponse response = lessonService.createLesson(courseId, request, instructorId);

        // Assert
        assertNotNull(response);
        assertEquals("New Lesson", response.title());
        assertEquals(ContentType.VIDEO, response.type());
        assertEquals(1, response.sortOrder()); // maxOrder(0) + 1 = 1
    }

    @Test
    void createLesson_WithCustomSortOrder() {
        // Arrange
        LessonRequest request = new LessonRequest(
                "Custom Order Lesson",
                ContentType.TEXT,
                null,
                "Lesson content",
                5, // custom sort order
                15,
                false,
                null  // instructorId from header
        );

        when(lessonRepository.save(any(Lesson.class))).thenAnswer(invocation -> {
            Lesson saved = invocation.getArgument(0);
            saved.setId(lessonId);
            return saved;
        });

        // Act
        LessonResponse response = lessonService.createLesson(courseId, request, instructorId);

        // Assert
        assertEquals(5, response.sortOrder());
    }

    // ============== UPDATE TESTS ==============

    @Test
    void updateLesson_Success() {
        // Arrange - instructorId comes from header parameter, not from request body
        LessonRequest request = new LessonRequest(
                "Updated Title",
                ContentType.PDF,
                "https://pdf.com/1",
                null,
                null,
                45,
                false,
                null  // not used - comes from header
        );

        when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(testLesson));
        when(lessonRepository.save(any(Lesson.class))).thenReturn(testLesson);

        // Act
        LessonResponse response = lessonService.updateLesson(lessonId, request, instructorId);

        // Assert
        assertNotNull(response);
        verify(lessonRepository, times(1)).save(any(Lesson.class));
    }

    @Test
    void updateLesson_NotOwner_ThrowsException() {
        // Arrange
        UUID otherInstructorId = UUID.randomUUID();
        LessonRequest request = new LessonRequest(
                "Hacked Title",
                ContentType.VIDEO,
                null,
                null,
                null,
                null,
                null,
                null  // not used - comes from header
        );

        when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(testLesson));

        // Act & Assert - the header instructorId (otherInstructorId) is checked against lesson's instructorId
        assertThrows(LessonService.LessonOwnershipException.class, () ->
            lessonService.updateLesson(lessonId, request, otherInstructorId)
        );
    }

    @Test
    void updateLesson_NotFound_ThrowsException() {
        // Arrange
        UUID notFoundId = UUID.randomUUID();
        LessonRequest request = new LessonRequest(
                "Title",
                ContentType.VIDEO,
                null,
                null,
                null,
                null,
                null,
                null  // not used
        );

        when(lessonRepository.findById(notFoundId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(LessonService.LessonNotFoundException.class, () ->
            lessonService.updateLesson(notFoundId, request, instructorId)
        );
    }

    // ============== DELETE TESTS ==============

    @Test
    void deleteLesson_Success() {
        // Arrange
        when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(testLesson));
        doNothing().when(lessonRepository).delete(testLesson);

        // Act
        lessonService.deleteLesson(lessonId, instructorId);

        // Assert
        verify(lessonRepository, times(1)).delete(testLesson);
    }

    @Test
    void deleteLesson_NotOwner_ThrowsException() {
        // Arrange
        UUID otherInstructorId = UUID.randomUUID();
        when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(testLesson));

        // Act & Assert
        assertThrows(LessonService.LessonOwnershipException.class, () ->
            lessonService.deleteLesson(lessonId, otherInstructorId)
        );
    }

    // ============== READ TESTS ==============

    @Test
    void getLessonById_Success() {
        // Arrange
        when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(testLesson));

        // Act
        LessonResponse response = lessonService.getLessonById(lessonId);

        // Assert
        assertNotNull(response);
        assertEquals(lessonId, response.id());
        assertEquals("Introduction to Java", response.title());
    }

    @Test
    void getLessonById_NotFound_ThrowsException() {
        // Arrange
        UUID notFoundId = UUID.randomUUID();
        when(lessonRepository.findById(notFoundId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(LessonService.LessonNotFoundException.class, () ->
            lessonService.getLessonById(notFoundId)
        );
    }

    @Test
    void getLessonsByCourse_Success() {
        // Arrange
        List<Lesson> lessons = List.of(testLesson);
        when(lessonRepository.findByCourseIdOrderBySortOrderAsc(courseId)).thenReturn(lessons);

        // Act
        List<LessonResponse> responses = lessonService.getLessonsByCourse(courseId);

        // Assert
        assertEquals(1, responses.size());
        assertEquals("Introduction to Java", responses.get(0).title());
    }

    @Test
    void getPublishedLessonsByCourse_Success() {
        // Arrange
        List<Lesson> lessons = List.of(testLesson);
        when(lessonRepository.findByCourseIdAndIsPublishedTrueOrderBySortOrderAsc(courseId))
                .thenReturn(lessons);

        // Act
        List<LessonResponse> responses = lessonService.getPublishedLessonsByCourse(courseId);

        // Assert
        assertEquals(1, responses.size());
        assertTrue(responses.get(0).isPublished());
    }

    // ============== REORDER TESTS ==============

    @Test
    void reorderLessons_Success() {
        // Arrange
        UUID lessonId1 = UUID.randomUUID();
        UUID lessonId2 = UUID.randomUUID();

        Lesson lesson1 = new Lesson();
        lesson1.setId(lessonId1);
        lesson1.setCourseId(courseId);
        lesson1.setInstructorId(instructorId);
        lesson1.setSortOrder(0);

        Lesson lesson2 = new Lesson();
        lesson2.setId(lessonId2);
        lesson2.setCourseId(courseId);
        lesson2.setInstructorId(instructorId);
        lesson2.setSortOrder(1);

        List<UUID> newOrder = List.of(lessonId2, lessonId1);

        when(lessonRepository.findById(lessonId1)).thenReturn(Optional.of(lesson1));
        when(lessonRepository.findById(lessonId2)).thenReturn(Optional.of(lesson2));
        when(lessonRepository.save(any(Lesson.class))).thenReturn(lesson1);

        // Act
        lessonService.reorderLessons(courseId, newOrder, instructorId);

        // Assert
        verify(lessonRepository, times(2)).save(any(Lesson.class));
    }

    @Test
    void reorderLessons_NotOwner_ThrowsException() {
        // Arrange
        UUID otherInstructorId = UUID.randomUUID();
        UUID lessonId1 = UUID.randomUUID();

        Lesson lesson1 = new Lesson();
        lesson1.setId(lessonId1);
        lesson1.setCourseId(courseId);
        lesson1.setInstructorId(instructorId); // owner

        List<UUID> newOrder = List.of(lessonId1);

        when(lessonRepository.findById(lessonId1)).thenReturn(Optional.of(lesson1));

        // Act & Assert
        assertThrows(LessonService.LessonOwnershipException.class, () ->
            lessonService.reorderLessons(courseId, newOrder, otherInstructorId)
        );
    }

    // ============== PUBLISH TESTS ==============

    @Test
    void publishLesson_Success() {
        // Arrange
        when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(testLesson));
        when(lessonRepository.save(any(Lesson.class))).thenReturn(testLesson);

        // Act
        LessonResponse response = lessonService.publishLesson(lessonId, false, instructorId);

        // Assert
        assertFalse(response.isPublished());
    }

    @Test
    void publishLesson_NotOwner_ThrowsException() {
        // Arrange
        UUID otherInstructorId = UUID.randomUUID();
        when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(testLesson));

        // Act & Assert
        assertThrows(LessonService.LessonOwnershipException.class, () ->
            lessonService.publishLesson(lessonId, true, otherInstructorId)
        );
    }
}
