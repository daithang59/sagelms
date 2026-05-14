package dev.sagelms.auth.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.sagelms.auth.dto.AuthResponse;
import dev.sagelms.auth.dto.InstructorApplicationRequest;
import dev.sagelms.auth.dto.InstructorApplicationResponse;
import dev.sagelms.auth.dto.LoginRequest;
import dev.sagelms.auth.dto.RegisterRequest;
import dev.sagelms.auth.dto.UpdateUserRequest;
import dev.sagelms.auth.dto.UserProfileResponse;
import dev.sagelms.auth.entity.InstructorApprovalStatus;
import dev.sagelms.auth.entity.RefreshToken;
import dev.sagelms.auth.entity.User;
import dev.sagelms.auth.entity.UserRole;
import dev.sagelms.auth.repository.AdminAuditLogRepository;
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
    private AdminAuditLogRepository adminAuditLogRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    private AuthService authService() {
        return new AuthService(
                userRepository,
                refreshTokenRepository,
                adminAuditLogRepository,
                notificationService,
                passwordEncoder,
                jwtService);
    }

    @Test
    void registerPublic_DefaultsToStudentRole() {
        AuthService authService = authService();
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
        AuthService authService = authService();

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
        AuthService authService = authService();
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
        AuthService authService = authService();
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
        AuthService authService = authService();
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

    @Test
    void updateUser_AdminCanEditBasicAndInstructorProfileFields() {
        AuthService authService = authService();
        UUID userId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setEmail("teacher@example.com");
        user.setFullName("Old Name");
        user.setRole(UserRole.INSTRUCTOR);
        user.setIsActive(true);
        user.setInstructorApprovalStatus(InstructorApprovalStatus.APPROVED);

        UpdateUserRequest request = new UpdateUserRequest(
                "new.teacher@example.com",
                "New Teacher",
                UserRole.INSTRUCTOR,
                true,
                null,
                InstructorApprovalStatus.APPROVED,
                "Senior Instructor",
                "Updated bio",
                "Java, React",
                "https://example.com",
                9,
                "Updated note",
                "Admin profile correction");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.existsByEmailAndIdNot("new.teacher@example.com", userId)).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserProfileResponse response = authService.updateUser(userId, adminId, request);

        assertEquals("new.teacher@example.com", response.email());
        assertEquals("New Teacher", response.fullName());
        assertEquals("Senior Instructor", response.instructorHeadline());
        assertEquals(9, response.instructorYearsExperience());
    }

    @Test
    void updateUser_AdminCannotDeactivateSelf() {
        AuthService authService = authService();
        UUID adminId = UUID.randomUUID();
        User admin = new User();
        admin.setId(adminId);
        admin.setEmail("admin@example.com");
        admin.setRole(UserRole.ADMIN);
        admin.setIsActive(true);

        when(userRepository.findById(adminId)).thenReturn(Optional.of(admin));

        UpdateUserRequest request = new UpdateUserRequest(
                null, null, null, false, null, null, null, null, null, null, null, null, "Security review");

        assertThrows(IllegalArgumentException.class, () -> authService.updateUser(adminId, adminId, request));
    }

    @Test
    void rejectInstructor_StoresReasonAndRevokesTokens() {
        AuthService authService = authService();
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setEmail("teacher@example.com");
        user.setRole(UserRole.INSTRUCTOR);
        user.setIsActive(false);
        user.setInstructorApprovalStatus(InstructorApprovalStatus.PENDING);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserProfileResponse response = authService.rejectInstructor(userId, UUID.randomUUID(), "Bio needs more teaching experience.");

        assertEquals(InstructorApprovalStatus.REJECTED, response.instructorApprovalStatus());
        assertEquals(false, response.isActive());
        assertEquals("Bio needs more teaching experience.", response.instructorApplicationNote());
        verify(refreshTokenRepository).revokeAllByUserId(userId);
    }

    @Test
    void deleteUser_SoftDeactivatesAndRevokesTokens() {
        AuthService authService = authService();
        UUID userId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setEmail("student@example.com");
        user.setRole(UserRole.STUDENT);
        user.setIsActive(true);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        authService.deleteUser(userId, adminId, "Policy violation.");

        assertEquals(false, user.getIsActive());
        verify(refreshTokenRepository).revokeAllByUserId(userId);
        verify(userRepository).save(user);
        verify(userRepository, never()).deleteById(userId);
    }
}
