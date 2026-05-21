package dev.sagelms.gateway.filters;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.concurrent.atomic.AtomicBoolean;

import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;

import reactor.core.publisher.Mono;

class RbacFilterTest {

    private final RbacFilter filter = new RbacFilter();

    @Test
    void allowsChallengeQuestionSetAttemptCreationForAuthenticatedLearners() {
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest
                .post("/api/v1/question-sets/46fb6333-219b-4816-83d7-fbe5c6dc4016/attempts")
                .build());
        AtomicBoolean downstreamCalled = new AtomicBoolean(false);
        GatewayFilterChain chain = request -> {
            downstreamCalled.set(true);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertTrue(downstreamCalled.get());
        assertNotEquals(HttpStatus.FORBIDDEN, exchange.getResponse().getStatusCode());
    }
}
