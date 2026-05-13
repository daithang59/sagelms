package dev.sagelms.course.api;

import dev.sagelms.course.dto.EnrollmentResponse;
import dev.sagelms.course.dto.ManageEnrollmentRequest;
import dev.sagelms.course.entity.EnrollmentStatus;
import dev.sagelms.course.service.EnrollmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Enrollment operations
 */
@RestController
@RequestMapping("/api/v1/courses")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    private static final String USER_ID_HEADER = "X-User-Id";
    private static final String ROLES_HEADER = "X-User-Roles";

    public EnrollmentController(EnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }

    /**
     * POST /api/v1/courses/{courseId}/enroll - Enroll in a course
     */
    @PostMapping("/{courseId}/enroll")
    public ResponseEntity<EnrollmentResponse> enroll(
            @PathVariable UUID courseId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles
    ) {
        EnrollmentResponse enrollment = enrollmentService.enrollStudent(courseId, userId, roles);
        return ResponseEntity.status(HttpStatus.CREATED).body(enrollment);
    }

    /**
     * DELETE /api/v1/courses/{courseId}/enroll - Unenroll from a course
     */
    @DeleteMapping("/{courseId}/enroll")
    public ResponseEntity<Void> unenroll(
            @PathVariable UUID courseId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles
    ) {
        enrollmentService.unenrollStudent(courseId, userId, roles);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{courseId}/unenroll")
    public ResponseEntity<Void> unenrollAlias(
            @PathVariable UUID courseId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles
    ) {
        enrollmentService.unenrollStudent(courseId, userId, roles);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/v1/courses/{courseId}/enrollments - Get enrollments for a course (instructor only)
     */
    @GetMapping("/{courseId}/enrollments")
    public ResponseEntity<List<EnrollmentResponse>> getCourseEnrollments(
            @PathVariable UUID courseId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles
    ) {
        return ResponseEntity.ok(enrollmentService.getEnrollmentsByCourse(courseId, userId, roles));
    }

    @GetMapping("/{courseId}/students")
    public ResponseEntity<List<EnrollmentResponse>> getCourseStudentsAlias(
            @PathVariable UUID courseId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles
    ) {
        return ResponseEntity.ok(enrollmentService.getEnrollmentsByCourse(courseId, userId, roles));
    }

    @PostMapping("/{courseId}/students/{participantId}/drop")
    public ResponseEntity<Void> dropCourseParticipant(
            @PathVariable UUID courseId,
            @PathVariable UUID participantId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles,
            @Valid @RequestBody(required = false) ManageEnrollmentRequest request
    ) {
        enrollmentService.dropParticipant(
                courseId,
                participantId,
                userId,
                roles,
                request != null ? request.reason() : null);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{courseId}/students/{participantId}/approve")
    public ResponseEntity<EnrollmentResponse> approveCourseParticipant(
            @PathVariable UUID courseId,
            @PathVariable UUID participantId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles
    ) {
        return ResponseEntity.ok(enrollmentService.approveParticipant(courseId, participantId, userId, roles));
    }

    @PostMapping("/{courseId}/students/{participantId}/reject")
    public ResponseEntity<EnrollmentResponse> rejectCourseParticipant(
            @PathVariable UUID courseId,
            @PathVariable UUID participantId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles,
            @Valid @RequestBody(required = false) ManageEnrollmentRequest request
    ) {
        return ResponseEntity.ok(enrollmentService.rejectParticipant(
                courseId,
                participantId,
                userId,
                roles,
                request != null ? request.reason() : null));
    }

    /**
     * GET /api/v1/courses/enrolled - Get student's enrolled courses
     */
    @GetMapping("/enrolled")
    public ResponseEntity<List<EnrollmentResponse>> getMyEnrollments(
            @RequestHeader(USER_ID_HEADER) UUID userId
    ) {
        return ResponseEntity.ok(enrollmentService.getVisibleEnrollmentsByStudent(userId));
    }

    /**
     * POST /api/v1/courses/{courseId}/complete - Mark course as completed
     */
    @PostMapping("/{courseId}/complete")
    public ResponseEntity<EnrollmentResponse> completeCourse(
            @PathVariable UUID courseId,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles
    ) {
        return ResponseEntity.ok(enrollmentService.completeCourse(courseId, userId, roles));
    }

    /**
     * GET /api/v1/courses/{courseId}/enroll/check - Check if enrolled
     */
    @GetMapping("/{courseId}/enroll/check")
    public ResponseEntity<EnrollmentCheckResponse> checkEnrollment(
            @PathVariable UUID courseId,
            @RequestHeader(USER_ID_HEADER) UUID userId
    ) {
        boolean enrolled = enrollmentService.isEnrolled(userId, courseId);
        EnrollmentStatus status = enrollmentService.getEnrollmentStatus(userId, courseId);
        return ResponseEntity.ok(new EnrollmentCheckResponse(enrolled, status));
    }

    /**
     * Simple response for enrollment check
     */
    public record EnrollmentCheckResponse(boolean enrolled, EnrollmentStatus status) {}
}
