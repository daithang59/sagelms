package dev.sagelms.content.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

@Component
public class CourseOwnershipClient {

    private final RestTemplate restTemplate;
    private final String courseServiceUrl;
    private final String internalSecret;

    public CourseOwnershipClient(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${app.course-service.url:http://localhost:8082}") String courseServiceUrl,
            @Value("${app.internal.secret:dev-internal-secret-change-me}") String internalSecret) {
        this.restTemplate = restTemplateBuilder.build();
        this.courseServiceUrl = courseServiceUrl;
        this.internalSecret = internalSecret;
    }

    public boolean isCourseOwner(UUID courseId, UUID userId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Internal-Secret", internalSecret);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            @SuppressWarnings("unchecked")
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    courseServiceUrl + "/internal/courses/{courseId}/ownership?userId={userId}",
                    HttpMethod.GET,
                    entity,
                    Map.class,
                    courseId,
                    userId);
            Map<String, Object> response = responseEntity.getBody();
            return Boolean.TRUE.equals(response != null ? response.get("owner") : null);
        } catch (RestClientException ex) {
            return false;
        }
    }

    public boolean canAccessCourseContent(UUID courseId, UUID userId, String roles) {
        if (userId == null) {
            return false;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Internal-Secret", internalSecret);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            @SuppressWarnings("unchecked")
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    courseServiceUrl + "/internal/courses/{courseId}/content-access?userId={userId}&roles={roles}",
                    HttpMethod.GET,
                    entity,
                    Map.class,
                    courseId,
                    userId,
                    roles != null ? roles : "");
            Map<String, Object> response = responseEntity.getBody();
            return Boolean.TRUE.equals(response != null ? response.get("accessible") : null);
        } catch (RestClientException ex) {
            return false;
        }
    }
}
