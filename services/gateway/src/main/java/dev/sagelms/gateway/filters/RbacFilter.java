package dev.sagelms.gateway.filters;

import java.util.List;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Global RBAC filter. The gateway is the first authorization boundary; services
 * still enforce the same checks because local/dev deployments can bypass it.
 */
@Component
public class RbacFilter implements GlobalFilter, Ordered {

    private static final List<String> ADMIN = List.of("ADMIN");
    private static final List<String> INSTRUCTOR_OR_ADMIN = List.of("INSTRUCTOR", "ADMIN");
    private static final List<String> STUDENT = List.of("STUDENT");

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        HttpMethod method = exchange.getRequest().getMethod();

        List<String> requiredRoles = requiredRoles(method, path);
        if (requiredRoles == null) {
            return chain.filter(exchange);
        }

        return exchange.getPrincipal()
                .filter(p -> p instanceof JwtAuthenticationToken)
                .cast(JwtAuthenticationToken.class)
                .map(jwtAuth -> {
                    Jwt jwt = jwtAuth.getToken();
                    List<String> roles = jwt.getClaimAsStringList("roles");
                    return roles != null && roles.stream().anyMatch(requiredRoles::contains);
                })
                .defaultIfEmpty(false)
                .flatMap(allowed -> allowed ? chain.filter(exchange) : forbidden(exchange));
    }

    private List<String> requiredRoles(HttpMethod method, String path) {
        if (path.startsWith("/api/v1/users")) {
            return ADMIN;
        }

        if (path.matches("^/api/v1/courses/[^/]+/enroll$")) {
            if (method == HttpMethod.POST || method == HttpMethod.DELETE) {
                return STUDENT;
            }
        }

        if (path.matches("^/api/v1/courses/[^/]+/complete$") && method == HttpMethod.POST) {
            return STUDENT;
        }

        if (isCourseMutation(method, path) || isLessonMutation(method, path)) {
            return INSTRUCTOR_OR_ADMIN;
        }

        return null;
    }

    private boolean isCourseMutation(HttpMethod method, String path) {
        if (!path.startsWith("/api/v1/courses")) {
            return false;
        }
        if (path.contains("/lessons") || path.endsWith("/enroll") || path.endsWith("/complete")) {
            return false;
        }
        return method == HttpMethod.POST || method == HttpMethod.PUT || method == HttpMethod.DELETE;
    }

    private boolean isLessonMutation(HttpMethod method, String path) {
        if (!(path.matches("^/api/v1/courses/[^/]+/lessons.*") || path.startsWith("/api/v1/lessons"))) {
            return false;
        }
        return method == HttpMethod.POST || method == HttpMethod.PUT
                || method == HttpMethod.DELETE || method == HttpMethod.PATCH;
    }

    private Mono<Void> forbidden(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
        return exchange.getResponse().setComplete();
    }

    @Override
    public int getOrder() {
        return 0;
    }
}
