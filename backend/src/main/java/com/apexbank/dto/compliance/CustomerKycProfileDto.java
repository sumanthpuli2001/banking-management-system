package com.apexbank.dto.compliance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerKycProfileDto {
    private Long id;
    private Long customerId;
    private String customerNumber;
    private String customerName;
    private String panNumber;
    private String aadhaarNumber;
    private String cddStatus;
    private String panVerificationStatus;
    private String panVerificationSource;
    private String aadhaarVerificationStatus;
    private String aadhaarVerificationSource;
    private String addressVerificationStatus;
    private Boolean isPep;
    private String riskCategory;
    private LocalDate lastKycReviewDate;
    private LocalDate nextKycReviewDueDate;
    private LocalDate documentExpiryDate;
    private String eddStatus;
    private String eddSourceOfWealth;
    private String eddBeneficialOwnership;
    private String eddApprovedBy;
    private LocalDateTime eddApprovedAt;
    private String kycNotes;
    private boolean isOverdue;
}
