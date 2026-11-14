package com.apexbank.dto.customer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerCreateRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String dateOfBirth;
    private String gender;

    @NotBlank(message = "PAN number is required")
    private String panNumber;

    @NotBlank(message = "Aadhaar number is required")
    private String aadhaarNumber;

    @NotBlank(message = "Email is required")
    @Email
    private String email;

    @NotBlank(message = "Phone number is required")
    private String phone;

    private String addressLine1;
    private String city;
    private String state;
    private String postalCode;

    private String occupation;
    private BigDecimal annualIncome;

    @NotNull(message = "Primary branch ID is required")
    private Long primaryBranchId;

    private String riskCategory; // LOW, MEDIUM, HIGH
}
