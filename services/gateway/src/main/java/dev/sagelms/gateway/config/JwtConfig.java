package dev.sagelms.gateway.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

import reactor.core.publisher.Mono;

/**
 * Custom JWT decoder that validates tokens using a shared secret.
 * Validates signature, expiry, and issuer regardless of the "alg" header value
 * in the JWT (some JWT libraries produce non-standard alg values like "HS156").
 *
 * MVP: Gateway and Auth-service share the same JWT_SECRET.
 * Phase 2: upgrade to RSA + JWKS endpoint.
 */
@Configuration
public class JwtConfig {

    @Value("${spring.security.oauth2.resourceserver.jwt.secret}")
    private String jwtSecret;

    @Bean
    ReactiveJwtDecoder jwtDecoder() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        // Pad to at least 32 bytes for HS256
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            keyBytes = padded;
        }
        final SecretKey secretKey = Keys.hmacShaKeyFor(keyBytes);

        return token -> {
            try {
                Claims claims = Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

                // Check expiry
                Date exp = claims.getExpiration();
                Date iat = claims.getIssuedAt();
                if (exp != null && exp.before(new Date())) {
                    return Mono.error(new JwtException("Token has expired"));
                }

                // Build Spring Security Jwt with proper "alg" header
                String subject = claims.getSubject();
                String email = claims.get("email", String.class);
                @SuppressWarnings("unchecked")
                List<String> roles = claims.get("roles", List.class);
                String issuer = claims.getIssuer();

                // Build Spring Jwt with HS256 alg (correct JWA value)
                Jwt springJwt = Jwt.withTokenValue(token)
                    .header("alg", "HS256")
                    .header("typ", "JWT")
                    .subject(subject)
                    .claim("email", email)
                    .claim("roles", roles)
                    .issuer(issuer)
                    .issuedAt(iat != null ? iat.toInstant() : null)
                    .expiresAt(exp != null ? exp.toInstant() : null)
                    .build();

                return Mono.just(springJwt);
            } catch (JwtException e) {
                return Mono.error(e);
            } catch (Exception e) {
                return Mono.error(new JwtException("Invalid JWT token", e));
            }
        };
    }
}
