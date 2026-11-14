package com.apexbank.dto.approval;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalDecisionRequest {

    @NotBlank(message = "Decision is required (APPROVED or REJECTED)")
    private String decision; // APPROVED or REJECTED

    private String checkerRemarks;
}
