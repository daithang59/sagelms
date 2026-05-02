package dev.sagelms.gateway.filters;

import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class UserContextHeaderFilterTest {

    @Test
    void stripsSpoofedUserHeadersBeforeForwarding() {
        UserContextHeaderFilter filter = new UserContextHeaderFilter("test-gateway-secret");
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/courses")
                .header("X-User-Id", "spoofed")
                .header("X-User-Email", "spoofed@example.com")
                .header("X-User-Roles", "ADMIN")
                .header("X-From-Gateway", "false")
                .header("X-Gateway-Secret", "spoofed")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        AtomicReference<ServerWebExchange> forwarded = new AtomicReference<>();
        GatewayFilterChain chain = next -> {
            forwarded.set(next);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        var headers = forwarded.get().getRequest().getHeaders();
        assertFalse(headers.containsKey("X-User-Id"));
        assertFalse(headers.containsKey("X-User-Email"));
        assertFalse(headers.containsKey("X-User-Roles"));
        assertEquals("true", headers.getFirst("X-From-Gateway"));
        assertEquals("test-gateway-secret", headers.getFirst("X-Gateway-Secret"));
    }
}
