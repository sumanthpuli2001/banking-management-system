package com.apexbank.repository.compliance;

import com.apexbank.entity.compliance.CustomerKycProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerKycProfileRepository extends JpaRepository<CustomerKycProfile, Long> {

    Optional<CustomerKycProfile> findByCustomerId(Long customerId);

    List<CustomerKycProfile> findByNextKycReviewDueDateBefore(LocalDate cutoffDate);

    List<CustomerKycProfile> findByEddStatus(String eddStatus);

    @Query("SELECT p FROM CustomerKycProfile p WHERE p.nextKycReviewDueDate <= :cutoffDate OR p.documentExpiryDate <= :cutoffDate OR p.eddStatus = 'PENDING_REVIEW' ORDER BY p.nextKycReviewDueDate ASC")
    Page<CustomerKycProfile> findKycExceptions(@Param("cutoffDate") LocalDate cutoffDate, Pageable pageable);

    long countByNextKycReviewDueDateBefore(LocalDate cutoffDate);

    long countByEddStatus(String eddStatus);
}
