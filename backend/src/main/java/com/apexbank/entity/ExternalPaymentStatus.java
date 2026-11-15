package com.apexbank.entity;

public enum ExternalPaymentStatus {
    INTERNAL,
    PENDING_CLEARING,
    SETTLED_EXTERNALLY,
    REJECTED_BY_NETWORK,
    TIMEOUT
}
