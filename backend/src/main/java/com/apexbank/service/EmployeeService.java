package com.apexbank.service;

import com.apexbank.dto.employee.EmployeeCreateRequest;
import com.apexbank.dto.employee.EmployeeDto;
import com.apexbank.entity.*;
import com.apexbank.exception.BankingException;
import com.apexbank.exception.ResourceNotFoundException;
import com.apexbank.repository.BranchRepository;
import com.apexbank.repository.EmployeeRepository;
import com.apexbank.repository.RoleRepository;
import com.apexbank.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Set;
import java.util.UUID;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeService(EmployeeRepository employeeRepository,
                           UserRepository userRepository,
                           BranchRepository branchRepository,
                           RoleRepository roleRepository,
                           PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Page<EmployeeDto> getEmployees(Long branchId, Pageable pageable) {
        Page<Employee> page = branchId != null ?
                employeeRepository.findByBranchId(branchId, pageable) :
                employeeRepository.findAll(pageable);
        return page.map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public EmployeeDto getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));
        return mapToDto(employee);
    }

    @Transactional
    public EmployeeDto createEmployee(EmployeeCreateRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BankingException("Username already in use: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BankingException("Email already in use: " + request.getEmail());
        }

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", request.getBranchId()));

        RoleType roleType = RoleType.valueOf(request.getRole());
        Role role = roleRepository.findByName(roleType)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", request.getRole()));

        String empCode = "EMP-" + branch.getBranchCode() + "-" + (System.currentTimeMillis() % 10000);

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode("Password@123"))
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .employeeId(empCode)
                .designation(request.getDesignation())
                .active(true)
                .branch(branch)
                .roles(Set.of(role))
                .build();
        User savedUser = userRepository.save(user);

        Employee employee = Employee.builder()
                .employeeCode(empCode)
                .user(savedUser)
                .branch(branch)
                .designation(request.getDesignation())
                .department(request.getDepartment() != null ? request.getDepartment() : "Retail Banking")
                .phone(request.getPhone())
                .salary(request.getSalary() != null ? request.getSalary() : new BigDecimal("65000.00"))
                .status("ACTIVE")
                .build();

        Employee savedEmployee = employeeRepository.save(employee);
        return mapToDto(savedEmployee);
    }

    @Transactional
    public EmployeeDto updateStatus(Long id, String status) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));
        employee.setStatus(status);
        if (employee.getUser() != null) {
            employee.getUser().setActive("ACTIVE".equalsIgnoreCase(status));
            userRepository.save(employee.getUser());
        }
        return mapToDto(employeeRepository.save(employee));
    }

    private EmployeeDto mapToDto(Employee e) {
        String roleStr = (e.getUser() != null && !e.getUser().getRoles().isEmpty())
                ? e.getUser().getRoles().iterator().next().getName().name()
                : "BANK_EMPLOYEE";

        return EmployeeDto.builder()
                .id(e.getId())
                .employeeCode(e.getEmployeeCode())
                .userId(e.getUser() != null ? e.getUser().getId() : null)
                .username(e.getUser() != null ? e.getUser().getUsername() : null)
                .fullName(e.getUser() != null ? e.getUser().getFullName() : e.getDesignation())
                .email(e.getUser() != null ? e.getUser().getEmail() : null)
                .phone(e.getPhone())
                .branchId(e.getBranch() != null ? e.getBranch().getId() : null)
                .branchCode(e.getBranch() != null ? e.getBranch().getBranchCode() : "N/A")
                .branchName(e.getBranch() != null ? e.getBranch().getName() : "N/A")
                .designation(e.getDesignation())
                .department(e.getDepartment())
                .salary(e.getSalary())
                .status(e.getStatus())
                .role(roleStr)
                .build();
    }
}
