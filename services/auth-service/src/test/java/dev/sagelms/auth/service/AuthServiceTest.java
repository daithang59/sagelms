package dev.sagelms.auth.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.sagelms.auth.dto.AuthResponse;
import dev.sagelms.auth.dto.RegisterRequest;
import dev.sagelms.auth.entity.User;
import dev.sagelms.auth.entity.UserRole;
import dev.sagelms.auth.repository.RefreshTokenRepository;
import dev.sagelms.auth.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Test
    void registerPublic_DefaultsToStudentRole() {
        AuthService authService = new AuthService(userRepository, refreshTokenRepository, passwordEncoder, jwtService);
        RegisterRequest request = new RegisterRequest("student@example.com", "Password123!", "Student User");

        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(passwordEncoder.encode(request.password())).thenReturn("hash");
        when(jwtService.generateAccessToken(any(User.class))).thenReturn("access-token");
        when(jwtService.getRefreshTokenExpiryMs()).thenReturn(604800000L);
        when(jwtService.getAccessTokenExpirySeconds()).thenReturn(1800L);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });

        AuthResponse response = authService.register(request);

        assertEquals(UserRole.STUDENT, response.user().role());
    }

    @Test
    void registerPublic_IgnoresAdminRoleInJsonPayload() throws Exception {
        String json = """
                {
                  "email": "admin-attempt@example.com",
                  "password": "Password123!",
                  "fullName": "Admin Attempt",
                  "role": "ADMIN"
                }
                """;
        RegisterRequest request = new ObjectMapper()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
                .readValue(json, RegisterRequest.class);
        AuthService authService = new AuthService(userRepository, refreshTokenRepository, passwordEncoder, jwtService);

        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(passwordEncoder.encode(request.password())).thenReturn("hash");
        when(jwtService.generateAccessToken(any(User.class))).thenReturn("access-token");
        when(jwtService.getRefreshTokenExpiryMs()).thenReturn(604800000L);
        when(jwtService.getAccessTokenExpirySeconds()).thenReturn(1800L);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });

        authService.register(request);

        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);
        org.mockito.Mockito.verify(userRepository).save(savedUser.capture());
        assertEquals(UserRole.STUDENT, savedUser.getValue().getRole());
    }
}
