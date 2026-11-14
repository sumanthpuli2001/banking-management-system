package com.apexbank.controller;

import com.apexbank.dto.auth.LoginRequest;
import com.apexbank.dto.auth.LoginResponse;
import com.apexbank.dto.auth.RefreshTokenRequest;
import com.apexbank.dto.auth.UserProfileDto;
import com.apexbank.dto.common.ApiResponse;
import com.apexbank.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication & Session Management", description = "Endpoints for institutional authentication, token refresh, and user profile")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate Banking Personnel / Customer", description = "Validates credentials, checks account lock state, issues access & refresh tokens")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request,
                                                           HttpServletRequest httpRequest) {
        LoginResponse response = authService.login(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(response, "Authentication successful. Institutional session established."));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh Authentication Token", description = "Exchanges a valid refresh token for a newly issued access token")
    public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        LoginResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.ok(response, "Token refreshed successfully."));
    }

    @GetMapping("/me")
    @Operation(summary = "Get Authenticated User Profile", description = "Returns active user identity, role assignments, permissions, and branch domicile")
    public ResponseEntity<ApiResponse<UserProfileDto>> getProfile(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("Unauthenticated session"));
        }
        UserProfileDto profile = authService.getCurrentUserProfile(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PostMapping("/logout")
    @Operation(summary = "Terminate Session", description = "Revokes user session and writes audit event")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.ok(null, "Session terminated successfully."));
    }
}
