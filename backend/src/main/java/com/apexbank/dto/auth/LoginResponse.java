package com.apexbank.dto.auth;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long expiresIn;
    private Long userId;
    private String username;
    private String email;
    private String fullName;
    private List<String> roles;
    private List<String> permissions;
    private Long branchId;
    private String branchCode;
    private String branchName;
    private Boolean isHeadOffice;
}
