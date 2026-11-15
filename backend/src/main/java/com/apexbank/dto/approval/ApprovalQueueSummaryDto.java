package com.apexbank.dto.approval;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalQueueSummaryDto {
    private long pendingCount;
    private long approvedCount;
    private long rejectedCount;
    private long escalatedCount;
    private long expiredCount;
    private long totalProcessed;
}
