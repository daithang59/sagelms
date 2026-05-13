package dev.sagelms.course.api;

import dev.sagelms.course.dto.EnrollmentResponse;
import dev.sagelms.course.service.EnrollmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/enrollments")
public class EnrollmentAliasController {

    private static final String USER_ID_HEADER = "X-User-Id";

    private final EnrollmentService enrollmentService;

    public EnrollmentAliasController(EnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }

    @GetMapping("/my")
    public ResponseEntity<List<EnrollmentResponse>> getMyEnrollments(
            @RequestHeader(USER_ID_HEADER) UUID userId
    ) {
        return ResponseEntity.ok(enrollmentService.getVisibleEnrollmentsByStudent(userId));
    }
}
