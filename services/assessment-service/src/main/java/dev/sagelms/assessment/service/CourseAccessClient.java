package dev.sagelms.assessment.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.UUID;

@Component
public class CourseAccessClient {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String courseServiceBaseUrl;
    private final String internalSecret;

    public CourseAccessClient(
            @Value("${app.course-service.base-url}") String courseServiceBaseUrl,
            @Value("${app.internal.secret}") String internalSecret) {
        this.courseServiceBaseUrl = courseServiceBaseUrl;
        this.internalSecret = internalSecret;
    }

    public boolean isCourseOwner(UUID courseId, UUID userId) {
        if (courseId == null || userId == null) {
            return false;
        }
        String url = UriComponentsBuilder
                .fromHttpUrl(courseServiceBaseUrl + "/internal/courses/{courseId}/ownership")
                .queryParam("userId", userId)
                .buildAndExpand(courseId)
                .toUriString();
        try {
            OwnershipResponse response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    internalRequest(),
                    OwnershipResponse.class).getBody();
            return response != null && response.owner();
        } catch (RestClientException ex) {
            throw new CourseAccessException("Cannot verify course ownership.");
        }
    }

    public boolean canAccessCourseContent(UUID courseId, UUID userId, String roles) {
        if (courseId == null || userId == null) {
            return false;
        }
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(courseServiceBaseUrl + "/internal/courses/{courseId}/content-access")
                .queryParam("userId", userId);
        if (roles != null && !roles.isBlank()) {
            builder.queryParam("roles", roles);
        }
        try {
            ContentAccessResponse response = restTemplate.exchange(
                    builder.buildAndExpand(courseId).toUriString(),
                    HttpMethod.GET,
                    internalRequest(),
                    ContentAccessResponse.class).getBody();
            return response != null && response.accessible();
        } catch (RestClientException ex) {
            throw new CourseAccessException("Cannot verify course access.");
        }
    }

    private HttpEntity<Void> internalRequest() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Secret", internalSecret);
        return new HttpEntity<>(headers);
    }

    public record OwnershipResponse(boolean owner) {}
    public record ContentAccessResponse(boolean accessible) {}

    public static class CourseAccessException extends RuntimeException {
        public CourseAccessException(String message) {
            super(message);
        }
    }
}
