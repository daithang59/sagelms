package dev.sagelms.gateway.filters;

import java.util.List;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Extracts JWT claims and injects user context headers for downstream services.
 *
 * Headers injected:
 *   X-User-Id     — JWT "sub" claim
 *   X-User-Email  — JWT "email" claim (if present)
 *   X-User-Roles  — JWT "roles" claim (comma-separated)
 */
@Component
public class UserContextHeaderFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return exchange.getPrincipal()
            .filter(principal -> principal instanceof JwtAuthenticationToken)
            .cast(JwtAuthenticationToken.class)
            .flatMap(jwtAuth -> {
                Jwt jwt = jwtAuth.getToken();

                String userId = jwt.getSubject();
                String email  = jwt.getClaimAsString("email");
                List<String> roles = jwt.getClaimAsStringList("roles");
                String rolesHeader = (roles == null) ? "" : String.join(",", roles);

                ServerHttpRequest mutated = exchange.getRequest().mutate()
                    .header("X-User-Id",    userId != null ? userId : "")
                    .header("X-User-Email", email  != null ? email  : "")
                    .header("X-User-Roles", rolesHeader)
                    .build();

                return chain.filter(exchange.mutate().request(mutated).build());
            })
            .switchIfEmpty(chain.filter(exchange));
    }

    @Override
    public int getOrder() {
        return -1; // runs after security filter
    }
}
