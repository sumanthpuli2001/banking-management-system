package com.apexbank.dto.transaction;

import com.apexbank.entity.AccountingPostingStatus;
import com.apexbank.entity.ExternalPaymentStatus;
import com.apexbank.entity.TransactionStatus;
import com.apexbank.entity.TransactionType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionDto {
    private Long id;
    private String referenceNumber;
    private String idempotencyKey;
    private String sourceAccountNumber;
    private String sourceCustomerName;
    private String destinationAccountNumber;
    private String destinationCustomerName;
    private BigDecimal amount;
    private BigDecimal fee;
    private TransactionType transactionType;
    private TransactionStatus status;
    private AccountingPostingStatus accountingPostingStatus;
    private ExternalPaymentStatus externalPaymentStatus;
    private String paymentChannel;
    private String narration;
    private String initiatedByUsername;
    private Long branchId;
    private String branchName;
    private String failureReason;
    private LocalDateTime settledAt;
    private LocalDateTime reconciledAt;
    private LocalDateTime transactionTimestamp;
}
