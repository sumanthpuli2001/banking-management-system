package com.apexbank.repository.approval;

import com.apexbank.entity.approval.ApprovalMatrixRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApprovalMatrixRuleRepository extends JpaRepository<ApprovalMatrixRule, Long> {

    Optional<ApprovalMatrixRule> findByRuleCode(String ruleCode);

    List<ApprovalMatrixRule> findByIsActiveTrue();

    List<ApprovalMatrixRule> findByOperationTypeAndIsActiveTrue(String operationType);

    @Query("SELECT r FROM ApprovalMatrixRule r WHERE r.operationType = :opType AND r.isActive = true " +
           "AND (:amount IS NULL OR (r.minAmount <= :amount AND (r.maxAmount IS NULL OR r.maxAmount >= :amount))) " +
           "ORDER BY r.minAmount DESC")
    List<ApprovalMatrixRule> findMatchingRules(@Param("opType") String operationType, @Param("amount") BigDecimal amount);
}
