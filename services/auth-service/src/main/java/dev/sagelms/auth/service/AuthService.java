package dev.sagelms.auth.service;

import dev.sagelms.auth.dto.*;
import dev.sagelms.auth.entity.AdminAuditAction;
import dev.sagelms.auth.entity.AdminAuditLog;
import dev.sagelms.auth.entity.RefreshToken;
import dev.sagelms.auth.entity.User;
import dev.sagelms.auth.entity.InstructorApprovalStatus;
import dev.sagelms.auth.entity.UserRole;
import dev.sagelms.auth.entity.NotificationType;
import dev.sagelms.auth.repository.AdminAuditLogRepository;
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
import java.util.Collection;
import java.util.List;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       AdminAuditLogRepository adminAuditLogRepository,
                       NotificationService notificationService,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.adminAuditLogRepository = adminAuditLogRepository;
        this.notificationService = notificationService;
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
    public List<UserProfileResponse> getUsersByIds(Collection<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }
        return userRepository.findAllById(userIds).stream()
                .map(UserProfileResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PublicUserProfileResponse> getPublicUserProfiles(List<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }
        return userRepository.findAllById(userIds).stream()
                .map(PublicUserProfileResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<UserProfileResponse> listUsers(UserRole role, Boolean isActive, String search, int page, int size) {
        PageRequest pageable = PageRequest.of(
                Math.max(0, page - 1), // API uses 1-based pages
                Math.min(size, 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<User> users = userRepository.findUsers(role, isActive, normalizeSearch(search), pageable);

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
    public UserProfileResponse updateUser(UUID userId, UUID actorUserId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        boolean editingSelf = actorUserId != null && actorUserId.equals(userId);
        UserRole previousRole = user.getRole();
        Boolean previousActive = user.getIsActive();
        InstructorApprovalStatus previousApproval = user.getInstructorApprovalStatus();

        if (!editingSelf && user.getRole() == UserRole.ADMIN
                && (request.role() != null || request.isActive() != null)) {
            throw new IllegalArgumentException("Admin accounts cannot be role-changed or deactivated by another admin.");
        }
        if (request.role() == UserRole.ADMIN && user.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Promoting another user to admin requires a higher-privileged admin workflow.");
        }

        if (request.email() != null && !request.email().isBlank()
                && !request.email().equalsIgnoreCase(user.getEmail())) {
            String email = request.email().trim().toLowerCase();
            if (userRepository.existsByEmailAndIdNot(email, userId)) {
                throw new EmailAlreadyExistsException(email);
            }
            user.setEmail(email);
        }
        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
        }
        if (request.role() != null) {
            if (editingSelf && request.role() != UserRole.ADMIN) {
                throw new IllegalArgumentException("Admin cannot remove their own admin role.");
            }
            user.setRole(request.role());
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(blankToNull(request.avatarUrl()));
        }
        if (request.instructorApprovalStatus() != null) {
            if (user.getRole() != UserRole.INSTRUCTOR) {
                throw new IllegalArgumentException("Only instructor users can have instructor approval status.");
            }
            if (request.instructorApprovalStatus() == InstructorApprovalStatus.REJECTED) {
                requireReason(request.instructorApplicationNote(), "Rejection reason is required.");
            }
            user.setInstructorApprovalStatus(request.instructorApprovalStatus());
            user.setInstructorReviewedAt(Instant.now());
            if (request.instructorApprovalStatus() == InstructorApprovalStatus.APPROVED) {
                user.setIsActive(true);
            } else {
                user.setIsActive(false);
                refreshTokenRepository.revokeAllByUserId(userId);
            }
        }
        if (request.isActive() != null) {
            if (editingSelf && !request.isActive()) {
                throw new IllegalArgumentException("Admin cannot deactivate their own account.");
            }
            if (!request.isActive()) {
                requireReason(request.adminActionReason(), "Deactivation reason is required.");
            }
            if (user.getRole() == UserRole.INSTRUCTOR
                    && user.getInstructorApprovalStatus() != InstructorApprovalStatus.APPROVED
                    && request.isActive()) {
                throw new IllegalArgumentException("Instructor must be approved before activation.");
            }
            user.setIsActive(request.isActive());
            if (!request.isActive()) {
                refreshTokenRepository.revokeAllByUserId(userId);
            }
        }
        if (request.instructorHeadline() != null) {
            user.setInstructorHeadline(blankToNull(request.instructorHeadline()));
        }
        if (request.instructorBio() != null) {
            user.setInstructorBio(blankToNull(request.instructorBio()));
        }
        if (request.instructorExpertise() != null) {
            user.setInstructorExpertise(blankToNull(request.instructorExpertise()));
        }
        if (request.instructorWebsite() != null) {
            user.setInstructorWebsite(blankToNull(request.instructorWebsite()));
        }
        if (request.instructorYearsExperience() != null) {
            user.setInstructorYearsExperience(Math.max(0, request.instructorYearsExperience()));
        }
        if (request.instructorApplicationNote() != null) {
            user.setInstructorApplicationNote(blankToNull(request.instructorApplicationNote()));
        }

        user = userRepository.save(user);
        auditUserUpdate(actorUserId, user, previousRole, previousActive, previousApproval, request);
        return UserProfileResponse.from(user);
    }

    @Transactional
    public UserProfileResponse updateSelfProfile(UUID userId, SelfProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        if (request.email() != null && !request.email().isBlank()
                && !request.email().equalsIgnoreCase(user.getEmail())) {
            String email = request.email().trim().toLowerCase();
            if (userRepository.existsByEmailAndIdNot(email, userId)) {
                throw new EmailAlreadyExistsException(email);
            }
            user.setEmail(email);
        }
        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(blankToNull(request.avatarUrl()));
        }
        if (user.getRole() == UserRole.INSTRUCTOR) {
            if (request.instructorHeadline() != null) {
                user.setInstructorHeadline(blankToNull(request.instructorHeadline()));
            }
            if (request.instructorBio() != null) {
                user.setInstructorBio(blankToNull(request.instructorBio()));
            }
            if (request.instructorExpertise() != null) {
                user.setInstructorExpertise(blankToNull(request.instructorExpertise()));
            }
            if (request.instructorWebsite() != null) {
                user.setInstructorWebsite(blankToNull(request.instructorWebsite()));
            }
            if (request.instructorYearsExperience() != null) {
                user.setInstructorYearsExperience(Math.max(0, request.instructorYearsExperience()));
            }
        }

        return UserProfileResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserProfileResponse approveInstructor(UUID userId, UUID actorUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        if (user.getRole() != UserRole.INSTRUCTOR) {
            throw new IllegalArgumentException("User is not an instructor.");
        }
        user.setInstructorApprovalStatus(InstructorApprovalStatus.APPROVED);
        user.setIsActive(true);
        user.setInstructorReviewedAt(Instant.now());
        User saved = userRepository.save(user);
        logAdminAction(actorUserId, userId, AdminAuditAction.APPROVE_INSTRUCTOR, null,
                "Instructor approved: " + saved.getEmail());
        notifyUser(userId, "Hồ sơ giảng viên đã được duyệt",
                "Bạn có thể đăng nhập và bắt đầu tạo khóa học trên SageLMS.", "/dashboard");
        return UserProfileResponse.from(saved);
    }

    @Transactional
    public UserProfileResponse rejectInstructor(UUID userId, UUID actorUserId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        if (user.getRole() != UserRole.INSTRUCTOR) {
            throw new IllegalArgumentException("User is not an instructor.");
        }
        String normalizedReason = requireReason(reason, "Rejection reason is required.");
        user.setInstructorApprovalStatus(InstructorApprovalStatus.REJECTED);
        user.setIsActive(false);
        user.setInstructorReviewedAt(Instant.now());
        user.setInstructorApplicationNote(normalizedReason);
        refreshTokenRepository.revokeAllByUserId(userId);
        User saved = userRepository.save(user);
        logAdminAction(actorUserId, userId, AdminAuditAction.REJECT_INSTRUCTOR, normalizedReason,
                "Instructor rejected: " + saved.getEmail());
        notifyUser(userId, "Hồ sơ giảng viên bị từ chối", normalizedReason, "/profile");
        return UserProfileResponse.from(saved);
    }

    @Transactional
    public void deleteUser(UUID userId, UUID actorUserId, String reason) {
        if (actorUserId != null && actorUserId.equals(userId)) {
            throw new IllegalArgumentException("Admin cannot deactivate their own account.");
        }
        String normalizedReason = requireReason(reason, "Deactivation reason is required.");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        if (user.getRole() == UserRole.ADMIN) {
            throw new IllegalArgumentException("Admin accounts cannot be deactivated by another admin.");
        }
        user.setIsActive(false);
        refreshTokenRepository.revokeAllByUserId(userId);
        userRepository.save(user);
        logAdminAction(actorUserId, userId, AdminAuditAction.DEACTIVATE_USER, normalizedReason,
                "User deactivated: " + user.getEmail());
        notifyUser(userId, "Tài khoản đã bị vô hiệu hóa", normalizedReason, "/login");
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

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String requireReason(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private void auditUserUpdate(
            UUID actorUserId,
            User user,
            UserRole previousRole,
            Boolean previousActive,
            InstructorApprovalStatus previousApproval,
            UpdateUserRequest request) {
        if (request.role() != null && request.role() != previousRole) {
            logAdminAction(actorUserId, user.getId(), AdminAuditAction.CHANGE_ROLE, request.adminActionReason(),
                    "Role changed from " + previousRole + " to " + request.role());
        }
        if (request.isActive() != null && !request.isActive().equals(previousActive)) {
            AdminAuditAction action = request.isActive() ? AdminAuditAction.UNLOCK_USER : AdminAuditAction.LOCK_USER;
            logAdminAction(actorUserId, user.getId(), action, request.adminActionReason(),
                    "Active changed from " + previousActive + " to " + request.isActive());
            notifyUser(
                    user.getId(),
                    request.isActive() ? "Tài khoản đã được mở khóa" : "Tài khoản đã bị khóa",
                    request.isActive()
                            ? "Bạn có thể đăng nhập và tiếp tục sử dụng SageLMS."
                            : request.adminActionReason(),
                    request.isActive() ? "/dashboard" : "/login");
        }
        if (request.instructorApprovalStatus() != null
                && request.instructorApprovalStatus() != previousApproval) {
            AdminAuditAction action = request.instructorApprovalStatus() == InstructorApprovalStatus.APPROVED
                    ? AdminAuditAction.APPROVE_INSTRUCTOR
                    : AdminAuditAction.REJECT_INSTRUCTOR;
            logAdminAction(actorUserId, user.getId(), action, request.instructorApplicationNote(),
                    "Instructor approval changed from " + previousApproval + " to " + request.instructorApprovalStatus());
            if (request.instructorApprovalStatus() == InstructorApprovalStatus.APPROVED) {
                notifyUser(user.getId(), "Hồ sơ giảng viên đã được duyệt",
                        "Bạn có thể đăng nhập và bắt đầu tạo khóa học trên SageLMS.", "/dashboard");
            } else if (request.instructorApprovalStatus() == InstructorApprovalStatus.REJECTED) {
                notifyUser(user.getId(), "Hồ sơ giảng viên bị từ chối",
                        request.instructorApplicationNote(), "/profile");
            }
        }
        if (request.email() != null || request.fullName() != null || request.avatarUrl() != null
                || request.instructorHeadline() != null || request.instructorBio() != null
                || request.instructorExpertise() != null || request.instructorWebsite() != null
                || request.instructorYearsExperience() != null || request.instructorApplicationNote() != null) {
            logAdminAction(actorUserId, user.getId(), AdminAuditAction.UPDATE_USER_PROFILE, request.adminActionReason(),
                    "Admin updated profile fields for " + user.getEmail());
        }
    }

    private void logAdminAction(
            UUID actorUserId,
            UUID targetUserId,
            AdminAuditAction action,
            String reason,
            String details) {
        AdminAuditLog log = new AdminAuditLog();
        log.setActorUserId(actorUserId);
        log.setTargetUserId(targetUserId);
        log.setAction(action);
        log.setReason(blankToNull(reason));
        log.setDetails(blankToNull(details));
        adminAuditLogRepository.save(log);
    }

    private void notifyUser(UUID userId, String title, String message, String targetUrl) {
        notificationService.create(new NotificationRequest(
                userId,
                NotificationType.SYSTEM,
                title,
                message,
                targetUrl));
    }

    private static String normalizeSearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        return search.trim();
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
