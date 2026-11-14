package com.apexbank.dto.account;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountStatusUpdateRequest {

    @NotBlank(message = "New status is required (ACTIVE, DORMANT, FROZEN, CLOSED)")
    private String newStatus;

    private String reason;
}
