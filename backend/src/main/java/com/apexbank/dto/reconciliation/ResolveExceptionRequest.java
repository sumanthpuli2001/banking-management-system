package com.apexbank.dto.reconciliation;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResolveExceptionRequest {
    @NotBlank(message = "Resolution audit notes are mandatory")
    private String resolutionNotes;
}
