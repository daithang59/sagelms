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
    private static final String USER_ID_HEADER = "X-User-Id";
    private static final String ROLES_HEADER = "X-User-Roles";

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
            @RequestParam(required = false) String search,
            @RequestHeader(value = USER_ID_HEADER, required = false) UUID userId,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles
    ) {
        // Priority: search > status > category > role-aware default
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(courseService.searchCoursesForViewer(search, roles, pageable));
        }
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(courseService.getCoursesByStatusForViewer(status, roles, pageable));
        }
        if (category != null && !category.isBlank()) {
            return ResponseEntity.ok(courseService.getCoursesByCategory(category, roles, pageable));
        }
        return ResponseEntity.ok(courseService.getCoursesForViewer(roles, pageable));
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
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles
    ) {
        return ResponseEntity.ok(courseService.getCoursesByInstructor(userId, roles));
    }

    /**
     * GET /api/v1/courses/{id} - Get course by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getCourseById(
            @PathVariable UUID id,
            @RequestHeader(value = USER_ID_HEADER, required = false) UUID userId,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles
    ) {
        return ResponseEntity.ok(courseService.getCourseById(id, userId, roles));
    }

    /**
     * POST /api/v1/courses - Create a new course
     */
    @PostMapping
    public ResponseEntity<CourseResponse> createCourse(
            @Valid @RequestBody CourseRequest request,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles
    ) {
        CourseResponse created = courseService.createCourse(request, userId, roles);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/v1/courses/{id} - Update a course
     */
    @PutMapping("/{id}")
    public ResponseEntity<CourseResponse> updateCourse(
            @PathVariable UUID id,
            @Valid @RequestBody CourseRequest request,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles
    ) {
        return ResponseEntity.ok(courseService.updateCourse(id, request, userId, roles));
    }

    /**
     * DELETE /api/v1/courses/{id} - Delete a course
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(
            @PathVariable UUID id,
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @RequestHeader(ROLES_HEADER) String roles
    ) {
        courseService.deleteCourse(id, userId, roles);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/v1/courses/category/{category} - Get courses by category
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<CourseResponse>> getCoursesByCategory(
            @PathVariable String category,
            @RequestHeader(value = ROLES_HEADER, required = false) String roles) {
        return ResponseEntity.ok(courseService.getCoursesByCategoryForViewer(category, roles));
    }
}
