package com.apexbank.dto.transaction;

import com.apexbank.entity.AccountingPostingStatus;
import com.apexbank.entity.ExternalPaymentStatus;
import com.apexbank.entity.TransactionStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionLifecycleDto {
    private String referenceNumber;
    private String idempotencyKey;
    private TransactionStatus currentStatus;
    private AccountingPostingStatus accountingPostingStatus;
    private ExternalPaymentStatus externalPaymentStatus;
    private String paymentChannel;
    private LocalDateTime initiatedAt;
    private LocalDateTime settledAt;
    private LocalDateTime reconciledAt;
    private List<LifecycleStepDto> lifecycleSteps;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LifecycleStepDto {
        private String stage; // e.g. INITIATION, VALIDATION, AUTHORIZATION, GL_POSTING, SETTLEMENT, RECONCILIATION
        private String status; // COMPLETED, PENDING, FAILED, SKIPPED
        private LocalDateTime timestamp;
        private String narration;
    }
}
