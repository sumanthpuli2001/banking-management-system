package com.apexbank.service;

import com.apexbank.dto.auth.LoginRequest;
import com.apexbank.dto.auth.LoginResponse;
import com.apexbank.dto.auth.UserProfileDto;
import com.apexbank.entity.Role;
import com.apexbank.entity.User;
import com.apexbank.exception.BankingException;
import com.apexbank.exception.UnauthorizedException;
import com.apexbank.repository.UserRepository;
import com.apexbank.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;
    private final AuditService auditService;

    @Value("${banking.security.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${banking.security.lockout-duration-minutes:15}")
    private int lockoutDurationMinutes;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       JwtTokenProvider tokenProvider,
                       AuditService auditService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.tokenProvider = tokenProvider;
        this.auditService = auditService;
    }

    @Transactional
    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String clientIp = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        String userAgent = httpRequest != null ? httpRequest.getHeader("User-Agent") : "Unknown";

        User user = userRepository.findByUsernameOrEmail(request.getUsername(), request.getUsername())
                .orElse(null);

        if (user != null && user.isLocked()) {
            if (user.getLockoutUntil() != null && user.getLockoutUntil().isAfter(LocalDateTime.now())) {
                auditService.recordLogin(request.getUsername(), user.getId(), "LOCKED", clientIp, userAgent, "Account currently locked");
                throw new BankingException("Account is temporarily locked due to excessive failed attempts. Try again after " + user.getLockoutUntil());
            } else {
                user.setLocked(false);
                user.setFailedAttempts(0);
                user.setLockoutUntil(null);
                userRepository.save(user);
            }
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            User authenticatedUser = (User) authentication.getPrincipal();
            authenticatedUser.setFailedAttempts(0);
            authenticatedUser.setLastLogin(LocalDateTime.now());
            userRepository.save(authenticatedUser);

            Long branchId = authenticatedUser.getBranch() != null ? authenticatedUser.getBranch().getId() : null;
            Boolean isHeadOffice = authenticatedUser.getBranch() != null ? authenticatedUser.getBranch().getIsHeadOffice() : true;

            String accessToken = tokenProvider.generateToken(authentication, authenticatedUser.getId(), branchId, isHeadOffice);
            String refreshToken = tokenProvider.generateRefreshToken(authenticatedUser.getUsername());

            List<String> roles = authenticatedUser.getRoles().stream()
                    .map(r -> r.getName().name())
                    .collect(Collectors.toList());

            List<String> permissions = authenticatedUser.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            auditService.recordLogin(authenticatedUser.getUsername(), authenticatedUser.getId(), "SUCCESS", clientIp, userAgent, null);
            auditService.recordAudit(authenticatedUser, "USER_LOGIN", "AUTHENTICATION", authenticatedUser.getId().toString(), "Session started via JWT", clientIp, "SUCCESS");

            return LoginResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .expiresIn(tokenProvider.getExpirationDuration())
                    .userId(authenticatedUser.getId())
                    .username(authenticatedUser.getUsername())
                    .email(authenticatedUser.getEmail())
                    .fullName(authenticatedUser.getFullName())
                    .roles(roles)
                    .permissions(permissions)
                    .branchId(branchId)
                    .branchCode(authenticatedUser.getBranch() != null ? authenticatedUser.getBranch().getBranchCode() : "HO-001")
                    .branchName(authenticatedUser.getBranch() != null ? authenticatedUser.getBranch().getName() : "Apex Central Head Office")
                    .isHeadOffice(isHeadOffice)
                    .build();

        } catch (BadCredentialsException ex) {
            if (user != null) {
                int attempts = user.getFailedAttempts() + 1;
                user.setFailedAttempts(attempts);
                if (attempts >= maxFailedAttempts) {
                    user.setLocked(true);
                    user.setLockoutUntil(LocalDateTime.now().plusMinutes(lockoutDurationMinutes));
                }
                userRepository.save(user);
                auditService.recordLogin(request.getUsername(), user.getId(), "FAILED_BAD_CREDENTIALS", clientIp, userAgent, "Bad Credentials. Attempts: " + attempts);
            } else {
                auditService.recordLogin(request.getUsername(), null, "FAILED_USER_NOT_FOUND", clientIp, userAgent, "User not found");
            }
            throw new BadCredentialsException("Invalid username or password");
        }
    }

    @Transactional
    public LoginResponse refreshToken(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        String username = tokenProvider.getUsernameFromToken(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("User no longer exists"));

        Authentication auth = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
        Long branchId = user.getBranch() != null ? user.getBranch().getId() : null;
        Boolean isHeadOffice = user.getBranch() != null ? user.getBranch().getIsHeadOffice() : true;

        String newAccessToken = tokenProvider.generateToken(auth, user.getId(), branchId, isHeadOffice);
        String newRefreshToken = tokenProvider.generateRefreshToken(username);

        List<String> roles = user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toList());

        List<String> permissions = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .expiresIn(tokenProvider.getExpirationDuration())
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles)
                .permissions(permissions)
                .branchId(branchId)
                .branchCode(user.getBranch() != null ? user.getBranch().getBranchCode() : "HO-001")
                .branchName(user.getBranch() != null ? user.getBranch().getName() : "Apex Central Head Office")
                .isHeadOffice(isHeadOffice)
                .build();
    }

    @Transactional(readOnly = true)
    public User getCurrentUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("User not located: " + username));
    }

    @Transactional(readOnly = true)
    public UserProfileDto getCurrentUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("User profile not located"));

        return UserProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .employeeId(user.getEmployeeId())
                .designation(user.getDesignation())
                .active(user.isActive())
                .lastLogin(user.getLastLogin())
                .branchId(user.getBranch() != null ? user.getBranch().getId() : null)
                .branchCode(user.getBranch() != null ? user.getBranch().getBranchCode() : "HO-001")
                .branchName(user.getBranch() != null ? user.getBranch().getName() : "Apex Central Head Office")
                .isHeadOffice(user.getBranch() != null ? user.getBranch().getIsHeadOffice() : true)
                .roles(user.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toList()))
                .permissions(user.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toList()))
                .build();
    }
}
