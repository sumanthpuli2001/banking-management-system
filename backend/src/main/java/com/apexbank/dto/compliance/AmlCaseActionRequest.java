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
public class AmlCaseActionRequest {

    @NotBlank(message = "Action is mandatory (INVESTIGATE, ESCALATE_MLRO, FILE_STR, CLOSE_FALSE_POSITIVE, CLOSE_EXPLAINED)")
    private String action;

    @NotBlank(message = "Investigation note or reasoning is mandatory")
    private String note;

    private String assignedOfficer;

    private String fiuStrReference; // For FILE_STR action
}
