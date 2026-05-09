package dev.sagelms.auth.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class GatewayOnlyFilter extends OncePerRequestFilter {

    private static final String GATEWAY_SECRET_HEADER = "X-Gateway-Secret";

    private final String gatewaySecret;

    public GatewayOnlyFilter(@Value("${app.gateway.secret:dev-gateway-secret-change-me}") String gatewaySecret) {
        this.gatewaySecret = gatewaySecret;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        if (path.startsWith("/api/v1/users") && !gatewaySecret.equals(request.getHeader(GATEWAY_SECRET_HEADER))) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Requests to user APIs must pass through gateway.");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
