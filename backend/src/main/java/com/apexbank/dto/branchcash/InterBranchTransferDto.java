package com.apexbank.dto.branchcash;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterBranchTransferDto {
    private Long id;
    private String transferNumber;
    private Long sourceBranchId;
    private String sourceBranchName;
    private Long destinationBranchId;
    private String destinationBranchName;
    private BigDecimal amount;
    private String status;
    private String transitCarrier;
    private String securitySealNumber;
    private String dispatchingOfficerUsername;
    private String receivingOfficerUsername;
    private String dispatchRemarks;
    private String receiptRemarks;
    private LocalDateTime dispatchedAt;
    private LocalDateTime receivedAt;
}
