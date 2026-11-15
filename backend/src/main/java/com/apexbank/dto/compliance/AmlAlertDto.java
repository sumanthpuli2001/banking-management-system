package com.apexbank.dto.compliance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AmlAlertDto {
    private Long id;
    private String alertNumber;
    private String ruleCode;
    private String ruleName;
    private String severity;
    private String status;
    private Long customerId;
    private String customerNumber;
    private String customerName;
    private String customerRiskCategory;
    private String accountNumber;
    private String transactionReference;
    private BigDecimal transactionAmount;
    private String transactionType;
    private Integer detectionScore;
    private String triggerDetails;
    private String assignedOfficer;
    private String fiuStrReference;
    private LocalDateTime detectedTimestamp;
    private LocalDateTime escalatedTimestamp;
    private LocalDateTime closedTimestamp;
    private String closureReason;
    private List<AmlCaseNoteDto> notes;
}
