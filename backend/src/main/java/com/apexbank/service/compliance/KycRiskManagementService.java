package com.apexbank.service.compliance;

import com.apexbank.dto.compliance.CustomerKycProfileDto;
import com.apexbank.dto.compliance.EddReviewRequest;
import com.apexbank.entity.Customer;
import com.apexbank.entity.compliance.CustomerKycProfile;
import com.apexbank.repository.CustomerRepository;
import com.apexbank.repository.compliance.CustomerKycProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class KycRiskManagementService {

    private final CustomerKycProfileRepository customerKycProfileRepository;
    private final CustomerRepository customerRepository;

    @Transactional
    public CustomerKycProfile getOrCreateProfile(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + customerId));

        return customerKycProfileRepository.findByCustomerId(customerId)
                .orElseGet(() -> {
                    LocalDate now = LocalDate.now();
                    LocalDate lastReview = now.minusMonths(6);
                    String risk = customer.getRiskCategory() != null ? customer.getRiskCategory().toUpperCase() : "LOW";
                    boolean isPep = "PEP".equals(risk);

                    CustomerKycProfile profile = CustomerKycProfile.builder()
                            .customerId(customer.getId())
                            .cddStatus("SIMULATED_VERIFIED")
                            .panVerificationStatus("SIMULATED_VERIFIED")
                            .panVerificationSource("SIMULATED_NSDL_SANDBOX")
                            .aadhaarVerificationStatus("SIMULATED_VERIFIED")
                            .aadhaarVerificationSource("SIMULATED_UIDAI_SANDBOX")
                            .addressVerificationStatus("VERIFIED")
                            .isPep(isPep)
                            .riskCategory(risk)
                            .lastKycReviewDate(lastReview)
                            .nextKycReviewDueDate(calculateNextReviewDueDate(risk, lastReview))
                            .documentExpiryDate(now.plusYears(5))
                            .eddStatus((isPep || "HIGH".equals(risk)) ? "PENDING_REVIEW" : "NOT_REQUIRED")
                            .kycNotes("Initial Customer Due Diligence profile generated in SIMULATED mode.")
                            .build();

                    return customerKycProfileRepository.save(profile);
                });
    }

    public LocalDate calculateNextReviewDueDate(String riskCategory, LocalDate fromDate) {
        if (fromDate == null) fromDate = LocalDate.now();
        if (riskCategory == null) return fromDate.plusYears(10);

        switch (riskCategory.toUpperCase()) {
            case "PEP":
            case "HIGH":
                // RBI Master Direction: High-risk & PEP customers require re-KYC at least once every 2 years
                return fromDate.plusYears(2);
            case "MEDIUM":
                // RBI: Medium-risk customers require re-KYC at least once every 8 years
                return fromDate.plusYears(8);
            case "LOW":
            default:
                // RBI: Low-risk customers require re-KYC at least once every 10 years
                return fromDate.plusYears(10);
        }
    }

    @Transactional(readOnly = true)
    public Page<CustomerKycProfileDto> getKycExceptions(Pageable pageable) {
        // Find overdue or pending EDD
        Page<CustomerKycProfile> page = customerKycProfileRepository.findKycExceptions(LocalDate.now(), pageable);

        List<CustomerKycProfileDto> dtos = page.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public CustomerKycProfileDto getProfileByCustomerId(Long customerId) {
        CustomerKycProfile profile = getOrCreateProfile(customerId);
        return mapToDto(profile);
    }

    @Transactional
    public CustomerKycProfileDto processEddReview(Long customerId, EddReviewRequest request, String approverUsername) {
        CustomerKycProfile profile = getOrCreateProfile(customerId);

        String decision = request.getDecision().toUpperCase();
        if ("APPROVE".equals(decision)) {
            profile.setEddStatus("APPROVED");
            profile.setEddSourceOfWealth(request.getSourceOfWealth() != null ? request.getSourceOfWealth() : "Documented & Verified via Discretionary Assessment");
            profile.setEddBeneficialOwnership(request.getBeneficialOwnership() != null ? request.getBeneficialOwnership() : "100% Sole Beneficial Owner Declared");
            profile.setEddApprovedBy(approverUsername != null ? approverUsername : "COMPLIANCE_HEAD");
            profile.setEddApprovedAt(LocalDateTime.now());
            profile.setLastKycReviewDate(LocalDate.now());
            profile.setNextKycReviewDueDate(calculateNextReviewDueDate(profile.getRiskCategory(), LocalDate.now()));
            profile.setKycNotes((profile.getKycNotes() != null ? profile.getKycNotes() + "\n" : "") +
                    String.format("[%s] EDD APPROVED by %s: %s", LocalDateTime.now(), approverUsername, request.getRemarks()));
        } else if ("REJECT".equals(decision)) {
            profile.setEddStatus("REJECTED");
            profile.setEddApprovedBy(approverUsername != null ? approverUsername : "COMPLIANCE_HEAD");
            profile.setEddApprovedAt(LocalDateTime.now());
            profile.setKycNotes((profile.getKycNotes() != null ? profile.getKycNotes() + "\n" : "") +
                    String.format("[%s] EDD REJECTED by %s: %s", LocalDateTime.now(), approverUsername, request.getRemarks()));
        } else {
            throw new IllegalArgumentException("Invalid EDD decision: " + decision + ". Expected APPROVE or REJECT.");
        }

        CustomerKycProfile saved = customerKycProfileRepository.save(profile);
        return mapToDto(saved);
    }

    @Transactional
    public CustomerKycProfileDto updateRiskCategory(Long customerId, String newRisk, String username) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + customerId));

        customer.setRiskCategory(newRisk.toUpperCase());
        customerRepository.save(customer);

        CustomerKycProfile profile = getOrCreateProfile(customerId);
        profile.setRiskCategory(newRisk.toUpperCase());
        profile.setIsPep("PEP".equalsIgnoreCase(newRisk));
        profile.setNextKycReviewDueDate(calculateNextReviewDueDate(newRisk, profile.getLastKycReviewDate()));

        if ("HIGH".equalsIgnoreCase(newRisk) || "PEP".equalsIgnoreCase(newRisk)) {
            if (!"APPROVED".equals(profile.getEddStatus())) {
                profile.setEddStatus("PENDING_REVIEW");
            }
        }

        profile.setKycNotes((profile.getKycNotes() != null ? profile.getKycNotes() + "\n" : "") +
                String.format("[%s] Risk reclassified to %s by %s.", LocalDateTime.now(), newRisk, username));

        CustomerKycProfile saved = customerKycProfileRepository.save(profile);
        return mapToDto(saved);
    }

    private CustomerKycProfileDto mapToDto(CustomerKycProfile p) {
        Customer c = customerRepository.findById(p.getCustomerId()).orElse(null);
        boolean overdue = p.getNextKycReviewDueDate() != null && p.getNextKycReviewDueDate().isBefore(LocalDate.now());

        return CustomerKycProfileDto.builder()
                .id(p.getId())
                .customerId(p.getCustomerId())
                .customerNumber(c != null ? c.getCustomerNumber() : "CIF-" + p.getCustomerId())
                .customerName(c != null ? c.getFullName() : "Customer #" + p.getCustomerId())
                .panNumber(c != null ? c.getPanNumber() : null)
                .aadhaarNumber(c != null ? c.getAadhaarNumber() : null)
                .cddStatus(p.getCddStatus())
                .panVerificationStatus(p.getPanVerificationStatus())
                .panVerificationSource(p.getPanVerificationSource())
                .aadhaarVerificationStatus(p.getAadhaarVerificationStatus())
                .aadhaarVerificationSource(p.getAadhaarVerificationSource())
                .addressVerificationStatus(p.getAddressVerificationStatus())
                .isPep(p.getIsPep())
                .riskCategory(p.getRiskCategory())
                .lastKycReviewDate(p.getLastKycReviewDate())
                .nextKycReviewDueDate(p.getNextKycReviewDueDate())
                .documentExpiryDate(p.getDocumentExpiryDate())
                .eddStatus(p.getEddStatus())
                .eddSourceOfWealth(p.getEddSourceOfWealth())
                .eddBeneficialOwnership(p.getEddBeneficialOwnership())
                .eddApprovedBy(p.getEddApprovedBy())
                .eddApprovedAt(p.getEddApprovedAt())
                .kycNotes(p.getKycNotes())
                .isOverdue(overdue)
                .build();
    }
}
