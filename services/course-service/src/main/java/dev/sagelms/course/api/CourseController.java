package dev.sagelms.course.api;

import dev.sagelms.course.dto.CourseRequest;
import dev.sagelms.course.dto.CourseResponse;
import dev.sagelms.course.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    /**
     * GET /api/v1/courses - Get all courses (with pagination)
     */
    @GetMapping
    public ResponseEntity<Page<CourseResponse>> getAllCourses(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search
    ) {
        // Priority: search > status+category > all
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(courseService.searchCourses(search, pageable));
        }
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(courseService.getCoursesByStatus(status, pageable));
        }
        // category filter is handled by /courses/category/{category} endpoint separately
        return ResponseEntity.ok(courseService.getAllCourses(pageable));
    }

    /**
     * GET /api/v1/courses/published - Get published courses only
     */
    @GetMapping("/published")
    public ResponseEntity<Page<CourseResponse>> getPublishedCourses(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(courseService.getPublishedCourses(pageable));
    }

    /**
     * GET /api/v1/courses/my-courses - Get courses by current instructor
     */
    @GetMapping("/my-courses")
    public ResponseEntity<List<CourseResponse>> getMyCourses(
            @RequestHeader("X-User-Id") UUID userId
    ) {
        return ResponseEntity.ok(courseService.getCoursesByInstructor(userId));
    }

    /**
     * GET /api/v1/courses/{id} - Get course by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getCourseById(@PathVariable UUID id) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    /**
     * POST /api/v1/courses - Create a new course
     */
    @PostMapping
    public ResponseEntity<CourseResponse> createCourse(
            @Valid @RequestBody CourseRequest request,
            @RequestHeader("X-User-Id") UUID userId
    ) {
        CourseResponse created = courseService.createCourse(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/v1/courses/{id} - Update a course
     */
    @PutMapping("/{id}")
    public ResponseEntity<CourseResponse> updateCourse(
            @PathVariable UUID id,
            @Valid @RequestBody CourseRequest request,
            @RequestHeader("X-User-Id") UUID userId
    ) {
        return ResponseEntity.ok(courseService.updateCourse(id, request, userId));
    }

    /**
     * DELETE /api/v1/courses/{id} - Delete a course
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID userId
    ) {
        courseService.deleteCourse(id, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/v1/courses/category/{category} - Get courses by category
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<CourseResponse>> getCoursesByCategory(@PathVariable String category) {
        return ResponseEntity.ok(courseService.getCoursesByCategory(category));
    }
}
