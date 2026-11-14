package com.apexbank.dto.auth;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDto {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String employeeId;
    private String designation;
    private boolean active;
    private LocalDateTime lastLogin;
    private Long branchId;
    private String branchCode;
    private String branchName;
    private Boolean isHeadOffice;
    private List<String> roles;
    private List<String> permissions;
}
