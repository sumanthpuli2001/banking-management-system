package com.apexbank.repository;

import com.apexbank.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmployeeCode(String employeeCode);
    Optional<Employee> findByUserId(Long userId);
    List<Employee> findByBranchId(Long branchId);
    Page<Employee> findByBranchId(Long branchId, Pageable pageable);
    boolean existsByEmployeeCode(String employeeCode);
}
