package com.apexbank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "title", nullable = false, length = 120)
    private String title;

    @Column(name = "message", nullable = false, length = 500)
    private String message;

    @Column(name = "category", length = 30)
    @Builder.Default
    private String category = "GENERAL"; // APPROVAL, SECURITY, TRANSACTION, GENERAL

    @Column(name = "read_status", nullable = false)
    @Builder.Default
    private boolean readStatus = false;

    @Column(name = "created_at", columnDefinition = "DATETIME", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
