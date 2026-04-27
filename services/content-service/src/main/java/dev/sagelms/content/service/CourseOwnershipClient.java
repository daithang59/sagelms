package dev.sagelms.content.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

@Component
public class CourseOwnershipClient {

    private final RestTemplate restTemplate;
    private final String courseServiceUrl;

    public CourseOwnershipClient(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${app.course-service.url:http://localhost:8082}") String courseServiceUrl) {
        this.restTemplate = restTemplateBuilder.build();
        this.courseServiceUrl = courseServiceUrl;
    }

    public boolean isCourseOwner(UUID courseId, UUID userId) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(
                    courseServiceUrl + "/internal/courses/{courseId}/ownership?userId={userId}",
                    Map.class,
                    courseId,
                    userId);
            return Boolean.TRUE.equals(response != null ? response.get("owner") : null);
        } catch (RestClientException ex) {
            return false;
        }
    }
}
