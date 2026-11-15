package com.apexbank.dto.accounting;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalReversalRequest {
    @NotBlank(message = "Reversal reason is mandatory for audit trail compliance")
    private String reason;
}
