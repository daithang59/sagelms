package dev.sagelms.gateway.config;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;

/**
 * Configures HS256 JWT decoder using a shared secret.
 * MVP: Gateway and Auth-service share the same JWT_SECRET.
 * Phase 2: upgrade to RSA + JWKS endpoint.
 */
@Configuration
public class JwtConfig {

    @Value("${spring.security.oauth2.resourceserver.jwt.secret}")
    private String jwtSecret;

    @Bean
    ReactiveJwtDecoder reactiveJwtDecoder() {
        byte[] keyBytes = jwtSecret.getBytes();
        // Pad to at least 32 bytes for HS256
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            keyBytes = padded;
        }
        SecretKey secretKey = new SecretKeySpec(keyBytes, "HmacSHA256");
        return NimbusReactiveJwtDecoder.withSecretKey(secretKey).build();
    }
}
