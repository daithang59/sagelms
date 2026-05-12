package dev.sagelms.course.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class AuthUserClient {

    private final RestTemplate restTemplate;
    private final String authServiceUrl;
    private final String internalSecret;

    public AuthUserClient(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${app.auth-service.url:http://localhost:8081}") String authServiceUrl,
            @Value("${app.internal.secret:dev-internal-secret-change-me}") String internalSecret) {
        this.restTemplate = restTemplateBuilder.build();
        this.authServiceUrl = authServiceUrl;
        this.internalSecret = internalSecret;
    }

    public Map<UUID, UserSummary> getUsersByIds(Collection<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Internal-Secret", internalSecret);
            HttpEntity<List<UUID>> entity = new HttpEntity<>(userIds.stream().distinct().toList(), headers);

            ResponseEntity<List<UserSummary>> response = restTemplate.exchange(
                    authServiceUrl + "/internal/users/profiles",
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<>() {});

            List<UserSummary> users = response.getBody();
            if (users == null || users.isEmpty()) {
                return Map.of();
            }
            return users.stream().collect(Collectors.toMap(UserSummary::id, Function.identity()));
        } catch (RestClientException ex) {
            return Map.of();
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record UserSummary(
            UUID id,
            String email,
            String fullName,
            String avatarUrl,
            String instructorHeadline,
            String instructorBio,
            String instructorExpertise,
            String instructorWebsite,
            Integer instructorYearsExperience) {}
}
