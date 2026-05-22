package dev.sagelms.course.api;

import dev.sagelms.course.dto.CourseResponse;
import dev.sagelms.course.service.CourseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/internal/courses")
public class InternalCourseController {

    private final CourseService courseService;

    public InternalCourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    // TODO: protect internal endpoints with a shared internal secret or mTLS.
    @GetMapping("/{courseId}/ownership")
    public ResponseEntity<OwnershipResponse> checkOwnership(
            @PathVariable UUID courseId,
            @RequestParam UUID userId) {
        return ResponseEntity.ok(new OwnershipResponse(courseService.isCourseOwner(courseId, userId)));
    }

    @GetMapping("/{courseId}/content-access")
    public ResponseEntity<ContentAccessResponse> checkContentAccess(
            @PathVariable UUID courseId,
            @RequestParam UUID userId,
            @RequestParam(required = false) String roles) {
        return ResponseEntity.ok(new ContentAccessResponse(
                courseService.canAccessCourseContent(courseId, userId, roles).accessible()));
    }

    @GetMapping("/{courseId}/ai-context")
    public ResponseEntity<CourseAiContextResponse> getAiContext(
            @PathVariable UUID courseId,
            @RequestParam UUID userId,
            @RequestParam(required = false) String roles) {
        if (!courseService.canAccessCourseContent(courseId, userId, roles).accessible()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        CourseResponse course = courseService.getCourseById(courseId);
        return ResponseEntity.ok(CourseAiContextResponse.from(course));
    }

    public record OwnershipResponse(boolean owner) {}
    public record ContentAccessResponse(boolean accessible) {}
    public record CourseAiContextResponse(
            UUID id,
            String title,
            String description,
            String category,
            String status,
            UUID instructorId,
            String instructorEmail,
            String instructorFullName,
            String enrollmentPolicy,
            long enrollmentCount
    ) {
        public static CourseAiContextResponse from(CourseResponse course) {
            return new CourseAiContextResponse(
                    course.id(),
                    course.title(),
                    course.description(),
                    course.category(),
                    course.status() != null ? course.status().name() : null,
                    course.instructorId(),
                    course.instructorEmail(),
                    course.instructorFullName(),
                    course.enrollmentPolicy() != null ? course.enrollmentPolicy().name() : null,
                    course.enrollmentCount());
        }
    }
}
