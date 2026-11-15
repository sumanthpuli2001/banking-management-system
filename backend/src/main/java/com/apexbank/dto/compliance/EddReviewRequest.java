package com.apexbank.dto.compliance;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EddReviewRequest {

    @NotBlank(message = "Decision is required (APPROVE or REJECT)")
    private String decision; // APPROVE or REJECT

    private String sourceOfWealth;

    private String beneficialOwnership;

    @NotBlank(message = "Review remarks are mandatory")
    private String remarks;
}
