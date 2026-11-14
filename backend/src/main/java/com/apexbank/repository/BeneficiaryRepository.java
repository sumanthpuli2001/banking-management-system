package com.apexbank.repository;

import com.apexbank.entity.Beneficiary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BeneficiaryRepository extends JpaRepository<Beneficiary, Long> {
    List<Beneficiary> findByCustomerIdAndStatus(Long customerId, String status);
    List<Beneficiary> findByCustomerId(Long customerId);
}
