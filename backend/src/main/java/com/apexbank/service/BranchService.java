package com.apexbank.service;

import com.apexbank.dto.branch.BranchCreateRequest;
import com.apexbank.dto.branch.BranchDto;
import com.apexbank.entity.Branch;
import com.apexbank.entity.Region;
import com.apexbank.exception.BankingException;
import com.apexbank.exception.ResourceNotFoundException;
import com.apexbank.repository.BankAccountRepository;
import com.apexbank.repository.BranchRepository;
import com.apexbank.repository.EmployeeRepository;
import com.apexbank.repository.LoanRepository;
import com.apexbank.repository.RegionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BranchService {

    private final BranchRepository branchRepository;
    private final RegionRepository regionRepository;
    private final EmployeeRepository employeeRepository;
    private final BankAccountRepository bankAccountRepository;
    private final LoanRepository loanRepository;

    public BranchService(BranchRepository branchRepository,
                         RegionRepository regionRepository,
                         EmployeeRepository employeeRepository,
                         BankAccountRepository bankAccountRepository,
                         LoanRepository loanRepository) {
        this.branchRepository = branchRepository;
        this.regionRepository = regionRepository;
        this.employeeRepository = employeeRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.loanRepository = loanRepository;
    }

    @Transactional(readOnly = true)
    public List<BranchDto> getAllBranches(Long regionId) {
        List<Branch> branches = regionId != null ? branchRepository.findByRegionId(regionId) : branchRepository.findAll();
        return branches.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BranchDto getBranchById(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", id));
        return mapToDto(branch);
    }

    @Transactional
    public BranchDto createBranch(BranchCreateRequest request) {
        if (branchRepository.existsByBranchCode(request.getBranchCode())) {
            throw new BankingException("Branch code already exists: " + request.getBranchCode());
        }
        if (branchRepository.existsByIfscCode(request.getIfscCode())) {
            throw new BankingException("IFSC code already exists: " + request.getIfscCode());
        }

        Region region = regionRepository.findById(request.getRegionId())
                .orElseThrow(() -> new ResourceNotFoundException("Region", "id", request.getRegionId()));

        Branch branch = Branch.builder()
                .branchCode(request.getBranchCode())
                .name(request.getName())
                .ifscCode(request.getIfscCode())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .postalCode(request.getPostalCode())
                .phone(request.getPhone())
                .email(request.getEmail())
                .status("ACTIVE")
                .isHeadOffice(false)
                .cashVaultBalance(request.getInitialVaultBalance() != null ? request.getInitialVaultBalance() : new BigDecimal("10000000.00"))
                .region(region)
                .build();

        Branch saved = branchRepository.save(branch);
        return mapToDto(saved);
    }

    @Transactional
    public BranchDto updateStatus(Long id, String status) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", id));
        branch.setStatus(status);
        return mapToDto(branchRepository.save(branch));
    }

    public BranchDto mapToDto(Branch b) {
        BigDecimal deposits = bankAccountRepository.sumBalanceByBranchId(b.getId());
        BigDecimal advances = loanRepository.sumAdvancesByBranchId(b.getId());
        long empCount = employeeRepository.findByBranchId(b.getId()).size();

        return BranchDto.builder()
                .id(b.getId())
                .branchCode(b.getBranchCode())
                .name(b.getName())
                .ifscCode(b.getIfscCode())
                .address(b.getAddress())
                .city(b.getCity())
                .state(b.getState())
                .postalCode(b.getPostalCode())
                .phone(b.getPhone())
                .email(b.getEmail())
                .status(b.getStatus())
                .isHeadOffice(b.getIsHeadOffice())
                .cashVaultBalance(b.getCashVaultBalance())
                .regionId(b.getRegion() != null ? b.getRegion().getId() : null)
                .regionName(b.getRegion() != null ? b.getRegion().getName() : "Central Corporate")
                .employeeCount(empCount)
                .totalDeposits(deposits != null ? deposits : BigDecimal.ZERO)
                .totalAdvances(advances != null ? advances : BigDecimal.ZERO)
                .build();
    }
}
