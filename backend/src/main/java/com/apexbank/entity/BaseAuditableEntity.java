package com.apexbank.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Setter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseAuditableEntity {

    @CreatedDate
    @Column(name = "created_at", columnDefinition = "DATETIME", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @LastModifiedDate
    @Column(name = "updated_at", columnDefinition = "DATETIME")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy = "SYSTEM";

    @LastModifiedBy
    @Column(name = "updated_by")
    private String updatedBy = "SYSTEM";

    @Version
    @Column(name = "version")
    private Long version = 0L;
}
