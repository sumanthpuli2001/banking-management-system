package com.apexbank.dto.deposit;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrematureClosureRequest {

    @NotNull(message = "Deposit ID is required")
    private Long depositId;

    private String payoutAccountNumber; // Optional: account where funds should be credited

    private String reason; // Liquidity requirement, medical, rate restructuring, etc.

    private Boolean acknowledgePenalty;
}
