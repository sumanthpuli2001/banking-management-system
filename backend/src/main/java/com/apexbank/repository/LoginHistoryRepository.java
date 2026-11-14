package com.apexbank.repository;

import com.apexbank.entity.LoginHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long> {
    Page<LoginHistory> findByUsername(String username, Pageable pageable);
    List<LoginHistory> findTop10ByOrderByLoginTimeDesc();
}
