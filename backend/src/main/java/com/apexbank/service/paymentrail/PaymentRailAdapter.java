package com.apexbank.service.paymentrail;

import com.apexbank.dto.paymentrail.PaymentRailRequestDto;
import com.apexbank.dto.paymentrail.PaymentRailResponseDto;
import com.apexbank.entity.BankAccount;
import com.apexbank.entity.User;
import com.apexbank.entity.paymentrail.PaymentRailType;
import com.apexbank.entity.paymentrail.PaymentTransactionRecord;

import java.math.BigDecimal;

public interface PaymentRailAdapter {

    PaymentRailType getRailType();

    PaymentRailResponseDto processPayment(PaymentRailRequestDto request, BankAccount sourceAccount, User currentUser);

    PaymentRailResponseDto queryStatus(PaymentTransactionRecord record);

    BigDecimal calculateFee(BigDecimal amount);

    void validateRequest(PaymentRailRequestDto request);

    boolean isSimulationMode();
}
