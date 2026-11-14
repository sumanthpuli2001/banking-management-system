package com.apexbank.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "login_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", nullable = false, length = 50)
    private String username;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "login_status", nullable = false, length = 20)
    private String loginStatus; // SUCCESS, FAILED_BAD_CREDENTIALS, LOCKED

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Column(name = "failure_reason", length = 150)
    private String failureReason;

    @Column(name = "login_time", columnDefinition = "DATETIME", nullable = false)
    @Builder.Default
    private LocalDateTime loginTime = LocalDateTime.now();
}
