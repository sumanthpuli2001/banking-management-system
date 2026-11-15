package com.apexbank.dto.compliance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AmlCaseNoteDto {
    private Long id;
    private Long alertId;
    private String authorUsername;
    private String actionTaken;
    private String noteText;
    private Boolean isConfidential;
    private LocalDateTime recordedAt;
}
