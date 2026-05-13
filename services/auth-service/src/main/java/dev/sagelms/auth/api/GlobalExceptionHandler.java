package dev.sagelms.auth.api;

import dev.sagelms.auth.dto.ErrorResponse;
import dev.sagelms.auth.service.AuthService;
import dev.sagelms.auth.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthService.EmailAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleEmailExists(
            AuthService.EmailAlreadyExistsException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(request.getRequestURI(), "AUTH_EMAIL_EXISTS", ex.getMessage()));
    }

    @ExceptionHandler(AuthService.InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(
            AuthService.InvalidCredentialsException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse(request.getRequestURI(), "AUTH_INVALID_CREDENTIALS", ex.getMessage()));
    }

    @ExceptionHandler(AuthService.InstructorPendingApprovalException.class)
    public ResponseEntity<ErrorResponse> handleInstructorPending(
            AuthService.InstructorPendingApprovalException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse(request.getRequestURI(), "INSTRUCTOR_PENDING_APPROVAL", ex.getMessage()));
    }

    @ExceptionHandler(AuthService.InstructorRejectedException.class)
    public ResponseEntity<ErrorResponse> handleInstructorRejected(
            AuthService.InstructorRejectedException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse(request.getRequestURI(), "INSTRUCTOR_REJECTED", ex.getMessage()));
    }

    @ExceptionHandler(AuthService.InvalidRefreshTokenException.class)
    public ResponseEntity<ErrorResponse> handleInvalidRefreshToken(
            AuthService.InvalidRefreshTokenException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse(request.getRequestURI(), "AUTH_INVALID_REFRESH_TOKEN", ex.getMessage()));
    }

    @ExceptionHandler(AuthService.UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(
            AuthService.UserNotFoundException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(request.getRequestURI(), "USER_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(NotificationService.NotificationNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotificationNotFound(
            NotificationService.NotificationNotFoundException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(request.getRequestURI(), "NOTIFICATION_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(UserController.ForbiddenException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(
            UserController.ForbiddenException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse(request.getRequestURI(), "FORBIDDEN", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("Validation failed.");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(request.getRequestURI(), "VALIDATION_ERROR", message));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(request.getRequestURI(), "BAD_REQUEST", ex.getMessage()));
    }
}
