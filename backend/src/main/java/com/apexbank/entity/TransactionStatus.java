package com.apexbank.entity;

public enum TransactionStatus {
    INITIATED,
    VALIDATING,
    PENDING_APPROVAL,
    PROCESSING,
    POSTED,
    SETTLED,
    RECONCILED,
    SUCCESS,
    FAILED,
    REVERSED;

    public boolean canTransitionTo(TransactionStatus target) {
        if (this == target) return true;
        switch (this) {
            case INITIATED:
                return target == VALIDATING || target == FAILED;
            case VALIDATING:
                return target == PENDING_APPROVAL || target == PROCESSING || target == FAILED;
            case PENDING_APPROVAL:
                return target == PROCESSING || target == FAILED;
            case PROCESSING:
                return target == POSTED || target == SETTLED || target == SUCCESS || target == FAILED;
            case POSTED:
                return target == SETTLED || target == SUCCESS || target == FAILED;
            case SETTLED:
            case SUCCESS:
                return target == RECONCILED || target == REVERSED;
            case RECONCILED:
                return target == REVERSED;
            case FAILED:
            case REVERSED:
                return false;
            default:
                return false;
        }
    }
}
