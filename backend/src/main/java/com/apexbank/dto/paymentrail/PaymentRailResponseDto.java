package com.apexbank.dto.paymentrail;

import com.apexbank.entity.paymentrail.PaymentRailMode;
import com.apexbank.entity.paymentrail.PaymentRailStatus;
import com.apexbank.entity.paymentrail.PaymentRailType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRailResponseDto {

    private String paymentReference;
    private String utrNumber;
    private String rrnNumber;
    private PaymentRailType railType;
    private PaymentRailMode operatingMode;
    private PaymentRailStatus status;
    private String responseCode;
    private String responseMessage;
    private String settlementBatchId;
    private BigDecimal amount;
    private BigDecimal fee;
    private BigDecimal totalDebited;
    private String sourceAccountNumber;
    private String destinationAccountNumber;
    private String beneficiaryName;
    private String beneficiaryIfsc;
    private Boolean isDemoSimulated;
    private String simulationNotes;
    private LocalDateTime initiatedAt;
    private LocalDateTime settledAt;
    private String debitGLAccount;
    private String creditGLAccount;
}
