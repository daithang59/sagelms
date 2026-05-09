package dev.sagelms.auth.service;

import dev.sagelms.auth.dto.*;
import dev.sagelms.auth.entity.RefreshToken;
import dev.sagelms.auth.entity.User;
import dev.sagelms.auth.entity.InstructorApprovalStatus;
import dev.sagelms.auth.entity.UserRole;
import dev.sagelms.auth.repository.RefreshTokenRepository;
import dev.sagelms.auth.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName());
        user.setRole(UserRole.STUDENT);
        user.setInstructorApprovalStatus(InstructorApprovalStatus.APPROVED);
        user.setIsActive(true);
        user = userRepository.save(user);

        return buildAuthResponse(user);
    }

    @Transactional
    public InstructorApplicationResponse applyInstructor(InstructorApplicationRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName());
        user.setRole(UserRole.INSTRUCTOR);
        user.setIsActive(false);
        user.setInstructorApprovalStatus(InstructorApprovalStatus.PENDING);
        user.setInstructorHeadline(request.headline());
        user.setInstructorBio(request.bio());
        user.setInstructorExpertise(request.expertise());
        user.setInstructorWebsite(request.website());
        user.setInstructorYearsExperience(request.yearsExperience());
        user.setInstructorApplicationNote(request.applicationNote());
        user = userRepository.save(user);

        return new InstructorApplicationResponse(
                user.getId(),
                user.getInstructorApprovalStatus().name(),
                "Instructor application submitted for admin review.");
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new InvalidCredentialsException());

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            if (user.getRole() == UserRole.INSTRUCTOR
                    && user.getInstructorApprovalStatus() == InstructorApprovalStatus.PENDING) {
                throw new InstructorPendingApprovalException();
            }
            if (user.getRole() == UserRole.INSTRUCTOR
                    && user.getInstructorApprovalStatus() == InstructorApprovalStatus.REJECTED) {
                throw new InstructorRejectedException();
            }
            throw new InvalidCredentialsException();
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        String tokenHash = sha256(request.refreshToken());

        RefreshToken stored = refreshTokenRepository.findByTokenHashAndRevokedFalse(tokenHash)
                .orElseThrow(() -> new InvalidRefreshTokenException());

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            stored.setRevoked(true);
            refreshTokenRepository.save(stored);
            throw new InvalidRefreshTokenException();
        }

        User user = stored.getUser();
        if (!canIssueToken(user)) {
            stored.setRevoked(true);
            refreshTokenRepository.save(stored);
            refreshTokenRepository.revokeAllByUserId(user.getId());
            throw new InvalidRefreshTokenException();
        }

        // Revoke the old token (rotation)
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        return UserProfileResponse.from(user);
    }

    @Transactional(readOnly = true)
    public Page<UserProfileResponse> listUsers(UserRole role, String search, int page, int size) {
        PageRequest pageable = PageRequest.of(
                Math.max(0, page - 1), // API uses 1-based pages
                Math.min(size, 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<User> users;
        boolean hasRole = role != null;
        boolean hasSearch = search != null && !search.isBlank();

        if (hasRole && hasSearch) {
            users = userRepository.findByRoleAndSearch(role, search, pageable);
        } else if (hasRole) {
            users = userRepository.findByRole(role, pageable);
        } else if (hasSearch) {
            users = userRepository.findBySearch(search, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

        return users.map(UserProfileResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<UserProfileResponse> listInstructorApplications(
            InstructorApprovalStatus status, int page, int size) {
        PageRequest pageable = PageRequest.of(
                Math.max(0, page - 1),
                Math.min(size, 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return userRepository.findByRoleAndInstructorApprovalStatus(
                UserRole.INSTRUCTOR,
                status != null ? status : InstructorApprovalStatus.PENDING,
                pageable).map(UserProfileResponse::from);
    }

    @Transactional
    public UserProfileResponse updateUser(UUID userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        if (request.role() != null) {
            user.setRole(request.role());
        }
        if (request.isActive() != null) {
            user.setIsActive(request.isActive());
        }
        user = userRepository.save(user);
        return UserProfileResponse.from(user);
    }

    @Transactional
    public UserProfileResponse approveInstructor(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        if (user.getRole() != UserRole.INSTRUCTOR) {
            throw new IllegalArgumentException("User is not an instructor.");
        }
        user.setInstructorApprovalStatus(InstructorApprovalStatus.APPROVED);
        user.setIsActive(true);
        user.setInstructorReviewedAt(Instant.now());
        return UserProfileResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserProfileResponse rejectInstructor(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        if (user.getRole() != UserRole.INSTRUCTOR) {
            throw new IllegalArgumentException("User is not an instructor.");
        }
        user.setInstructorApprovalStatus(InstructorApprovalStatus.REJECTED);
        user.setIsActive(false);
        user.setInstructorReviewedAt(Instant.now());
        refreshTokenRepository.revokeAllByUserId(userId);
        return UserProfileResponse.from(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new UserNotFoundException(userId);
        }
        refreshTokenRepository.revokeAllByUserId(userId);
        userRepository.deleteById(userId);
    }

    // ── Private helpers ─────────────────────────────────

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(user);

        // Generate opaque refresh token + store its hash
        String rawRefreshToken = UUID.randomUUID().toString();
        RefreshToken rt = new RefreshToken();
        rt.setUser(user);
        rt.setTokenHash(sha256(rawRefreshToken));
        rt.setExpiresAt(Instant.now().plusMillis(jwtService.getRefreshTokenExpiryMs()));
        refreshTokenRepository.save(rt);

        return new AuthResponse(
                accessToken,
                rawRefreshToken,
                jwtService.getAccessTokenExpirySeconds(),
                UserProfileResponse.from(user));
    }

    private boolean canIssueToken(User user) {
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            return false;
        }
        return user.getRole() != UserRole.INSTRUCTOR
                || user.getInstructorApprovalStatus() == InstructorApprovalStatus.APPROVED;
    }

    private static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    // ── Exceptions ──────────────────────────────────────

    public static class EmailAlreadyExistsException extends RuntimeException {
        public EmailAlreadyExistsException(String email) {
            super("Email already registered: " + email);
        }
    }

    public static class InvalidCredentialsException extends RuntimeException {
        public InvalidCredentialsException() {
            super("Invalid email or password.");
        }
    }

    public static class InvalidRefreshTokenException extends RuntimeException {
        public InvalidRefreshTokenException() {
            super("Refresh token is invalid or expired.");
        }
    }

    public static class InstructorPendingApprovalException extends RuntimeException {
        public InstructorPendingApprovalException() {
            super("Instructor account is pending admin approval.");
        }
    }

    public static class InstructorRejectedException extends RuntimeException {
        public InstructorRejectedException() {
            super("Instructor application was rejected.");
        }
    }

    public static class UserNotFoundException extends RuntimeException {
        public UserNotFoundException(UUID userId) {
            super("User not found: " + userId);
        }
    }
}
