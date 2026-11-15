package com.apexbank.repository;

import com.apexbank.entity.TellerHandover;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TellerHandoverRepository extends JpaRepository<TellerHandover, Long> {
    Optional<TellerHandover> findByHandoverNumber(String handoverNumber);
    List<TellerHandover> findByDrawerIdOrderByHandoverTimestampDesc(Long drawerId);
    Page<TellerHandover> findAllByOrderByHandoverTimestampDesc(Pageable pageable);
}
