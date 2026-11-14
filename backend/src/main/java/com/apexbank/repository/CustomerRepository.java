package com.apexbank.repository;

import com.apexbank.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByCustomerNumber(String customerNumber);
    Optional<Customer> findByUserId(Long userId);
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByPhone(String phone);
    boolean existsByCustomerNumber(String customerNumber);
    Page<Customer> findByPrimaryBranchId(Long branchId, Pageable pageable);

    @Query("SELECT c FROM Customer c WHERE " +
           "LOWER(c.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "c.customerNumber LIKE CONCAT('%', :query, '%') OR " +
           "c.email LIKE CONCAT('%', :query, '%') OR " +
           "c.phone LIKE CONCAT('%', :query, '%')")
    Page<Customer> searchCustomers(@Param("query") String query, Pageable pageable);
}
