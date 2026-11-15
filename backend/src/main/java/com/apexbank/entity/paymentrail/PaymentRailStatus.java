package com.apexbank.entity.paymentrail;

public enum PaymentRailStatus {
    INITIATED,
    SIMULATED_ACCEPTED,
    SIMULATED_PENDING,
    SIMULATED_REJECTED,
    SIMULATED_TIMEOUT,
    SETTLED,
    RECONCILED,
    FAILED
}
