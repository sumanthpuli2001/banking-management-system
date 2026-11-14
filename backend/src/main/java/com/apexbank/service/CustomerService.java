package com.apexbank.service;

import com.apexbank.dto.customer.CustomerCreateRequest;
import com.apexbank.dto.customer.CustomerDto;
import com.apexbank.entity.*;
import com.apexbank.exception.BankingException;
import com.apexbank.exception.ResourceNotFoundException;
import com.apexbank.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BankAccountRepository bankAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomerService(CustomerRepository customerRepository,
                           BranchRepository branchRepository,
                           UserRepository userRepository,
                           RoleRepository roleRepository,
                           BankAccountRepository bankAccountRepository,
                           PasswordEncoder passwordEncoder) {
        this.customerRepository = customerRepository;
        this.branchRepository = branchRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Page<CustomerDto> getCustomers(Long branchId, String query, Pageable pageable) {
        Page<Customer> page;
        if (query != null && !query.trim().isEmpty()) {
            page = customerRepository.searchCustomers(query.trim(), pageable);
        } else if (branchId != null) {
            page = customerRepository.findByPrimaryBranchId(branchId, pageable);
        } else {
            page = customerRepository.findAll(pageable);
        }
        return page.map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public CustomerDto getCustomerById(Long id) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));
        return mapToDto(c);
    }

    @Transactional(readOnly = true)
    public CustomerDto getCustomerByUserId(Long userId) {
        Customer c = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile for user", "id", userId));
        return mapToDto(c);
    }

    @Transactional
    public CustomerDto createCustomer(CustomerCreateRequest request) {
        Branch branch = branchRepository.findById(request.getPrimaryBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", request.getPrimaryBranchId()));

        String customerNumber = "CIF-" + (100000 + (System.currentTimeMillis() % 900000));
        String username = "cust_" + (System.currentTimeMillis() % 100000);

        Role customerRole = roleRepository.findByName(RoleType.CUSTOMER)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "CUSTOMER"));

        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode("Password@123"))
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .active(true)
                .branch(branch)
                .roles(Set.of(customerRole))
                .build();
        User savedUser = userRepository.save(user);

        // Sensitive identity masking (PAN: ABCDE****F, Aadhaar: ********1234)
        String rawPan = request.getPanNumber().toUpperCase();
        String maskedPan = rawPan.length() >= 10 ? rawPan.substring(0, 5) + "****" + rawPan.substring(9) : rawPan;

        String rawAadhaar = request.getAadhaarNumber().replaceAll("\\s+", "");
        String maskedAadhaar = rawAadhaar.length() >= 12 ? "********" + rawAadhaar.substring(8) : rawAadhaar;

        Customer customer = Customer.builder()
                .customerNumber(customerNumber)
                .user(savedUser)
                .primaryBranch(branch)
                .fullName(request.getFullName())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .panNumber(maskedPan)
                .aadhaarNumber(maskedAadhaar)
                .email(request.getEmail())
                .phone(request.getPhone())
                .addressLine1(request.getAddressLine1())
                .city(request.getCity())
                .state(request.getState())
                .postalCode(request.getPostalCode())
                .country("India")
                .kycStatus("VERIFIED")
                .kycVerifiedAt(LocalDateTime.now())
                .riskCategory(request.getRiskCategory() != null ? request.getRiskCategory() : "LOW")
                .occupation(request.getOccupation())
                .annualIncome(request.getAnnualIncome())
                .status("ACTIVE")
                .build();

        Customer savedCustomer = customerRepository.save(customer);
        return mapToDto(savedCustomer);
    }

    @Transactional
    public CustomerDto updateKycStatus(Long id, String status) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));
        c.setKycStatus(status);
        if ("VERIFIED".equalsIgnoreCase(status)) {
            c.setKycVerifiedAt(LocalDateTime.now());
        }
        return mapToDto(customerRepository.save(c));
    }

    private CustomerDto mapToDto(Customer c) {
        List<BankAccount> accounts = bankAccountRepository.findByCustomerId(c.getId());
        BigDecimal totalBal = accounts.stream()
                .map(BankAccount::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CustomerDto.builder()
                .id(c.getId())
                .customerNumber(c.getCustomerNumber())
                .userId(c.getUser() != null ? c.getUser().getId() : null)
                .fullName(c.getFullName())
                .dateOfBirth(c.getDateOfBirth())
                .gender(c.getGender())
                .panNumber(c.getPanNumber())
                .aadhaarNumber(c.getAadhaarNumber())
                .email(c.getEmail())
                .phone(c.getPhone())
                .addressLine1(c.getAddressLine1())
                .city(c.getCity())
                .state(c.getState())
                .postalCode(c.getPostalCode())
                .country(c.getCountry())
                .kycStatus(c.getKycStatus())
                .riskCategory(c.getRiskCategory())
                .occupation(c.getOccupation())
                .annualIncome(c.getAnnualIncome())
                .status(c.getStatus())
                .primaryBranchId(c.getPrimaryBranch() != null ? c.getPrimaryBranch().getId() : null)
                .primaryBranchCode(c.getPrimaryBranch() != null ? c.getPrimaryBranch().getBranchCode() : "N/A")
                .primaryBranchName(c.getPrimaryBranch() != null ? c.getPrimaryBranch().getName() : "N/A")
                .accountCount(accounts.size())
                .totalBalance(totalBal)
                .build();
    }
}
