package dev.sagelms.gateway.filters;

import java.util.List;
import java.util.Map;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Global RBAC filter — enforces role-based access on certain path prefixes.
 * Runs after JWT is validated and UserContextHeaderFilter has extracted claims.
 *
 * Rule map: path prefix → required roles (any match = allow).
 * Paths not listed here are open to any authenticated user.
 */
@Component
public class RbacFilter implements GlobalFilter, Ordered {

    /** Path prefix → allowed roles */
    private static final Map<String, List<String>> ROLE_RULES = Map.of(
            "/api/v1/users", List.of("ADMIN")
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        // Find matching rule
        List<String> requiredRoles = null;
        for (var entry : ROLE_RULES.entrySet()) {
            if (path.startsWith(entry.getKey())) {
                requiredRoles = entry.getValue();
                break;
            }
        }

        // No rule -> pass through
        if (requiredRoles == null) {
            return chain.filter(exchange);
        }

        List<String> finalRequired = requiredRoles;

        return exchange.getPrincipal()
                .filter(p -> p instanceof JwtAuthenticationToken)
                .cast(JwtAuthenticationToken.class)
                .map(jwtAuth -> {
                    Jwt jwt = jwtAuth.getToken();
                    List<String> roles = jwt.getClaimAsStringList("roles");
                    return roles != null && roles.stream().anyMatch(finalRequired::contains);
                })
                .defaultIfEmpty(false)
                .flatMap(allowed -> {
                    if (allowed) {
                        return chain.filter(exchange);
                    }
                    return forbidden(exchange);
                });
    }

    private Mono<Void> forbidden(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
        return exchange.getResponse().setComplete();
    }

    @Override
    public int getOrder() {
        return 0; // runs after UserContextHeaderFilter (-1)
    }
}
