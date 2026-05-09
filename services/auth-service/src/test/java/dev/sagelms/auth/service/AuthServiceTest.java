package dev.sagelms.auth.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.sagelms.auth.dto.AuthResponse;
import dev.sagelms.auth.dto.InstructorApplicationRequest;
import dev.sagelms.auth.dto.InstructorApplicationResponse;
import dev.sagelms.auth.dto.LoginRequest;
import dev.sagelms.auth.dto.RegisterRequest;
import dev.sagelms.auth.entity.InstructorApprovalStatus;
import dev.sagelms.auth.entity.RefreshToken;
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
import java.util.Optional;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
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
        verify(userRepository).save(savedUser.capture());
        assertEquals(UserRole.STUDENT, savedUser.getValue().getRole());
    }

    @Test
    void applyInstructor_CreatesPendingInactiveInstructor() {
        AuthService authService = new AuthService(userRepository, refreshTokenRepository, passwordEncoder, jwtService);
        InstructorApplicationRequest request = new InstructorApplicationRequest(
                "teacher@example.com",
                "Password123!",
                "Teacher User",
                "Senior Java Instructor",
                "I teach backend systems.",
                "Java, Spring Boot",
                "https://example.com",
                8,
                "Portfolio included.");

        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(passwordEncoder.encode(request.password())).thenReturn("hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });

        InstructorApplicationResponse response = authService.applyInstructor(request);

        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(savedUser.capture());
        User user = savedUser.getValue();
        assertEquals(UserRole.INSTRUCTOR, user.getRole());
        assertEquals(InstructorApprovalStatus.PENDING, user.getInstructorApprovalStatus());
        assertFalse(user.getIsActive());
        assertEquals("PENDING", response.status());
    }

    @Test
    void loginPendingInstructor_WithWrongPasswordDoesNotRevealApprovalStatus() {
        AuthService authService = new AuthService(userRepository, refreshTokenRepository, passwordEncoder, jwtService);
        User user = new User();
        user.setEmail("teacher@example.com");
        user.setPasswordHash("hash");
        user.setRole(UserRole.INSTRUCTOR);
        user.setIsActive(false);
        user.setInstructorApprovalStatus(InstructorApprovalStatus.PENDING);

        when(userRepository.findByEmail("teacher@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "hash")).thenReturn(false);

        assertThrows(
                AuthService.InvalidCredentialsException.class,
                () -> authService.login(new LoginRequest("teacher@example.com", "wrong-password")));
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void refresh_InactiveUserRevokesTokenAndFails() {
        AuthService authService = new AuthService(userRepository, refreshTokenRepository, passwordEncoder, jwtService);
        User user = new User();
        UUID userId = UUID.randomUUID();
        user.setId(userId);
        user.setEmail("inactive@example.com");
        user.setRole(UserRole.STUDENT);
        user.setIsActive(false);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash("hash");
        refreshToken.setExpiresAt(Instant.now().plusSeconds(3600));

        when(refreshTokenRepository.findByTokenHashAndRevokedFalse(any())).thenReturn(Optional.of(refreshToken));

        assertThrows(
                AuthService.InvalidRefreshTokenException.class,
                () -> authService.refresh(new dev.sagelms.auth.dto.RefreshTokenRequest("raw-token")));
        verify(refreshTokenRepository).revokeAllByUserId(userId);
        assertEquals(true, refreshToken.getRevoked());
    }
}
