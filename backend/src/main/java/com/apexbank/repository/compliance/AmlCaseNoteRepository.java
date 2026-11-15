package com.apexbank.repository.compliance;

import com.apexbank.entity.compliance.AmlCaseNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AmlCaseNoteRepository extends JpaRepository<AmlCaseNote, Long> {

    List<AmlCaseNote> findByAlertIdOrderByRecordedAtAsc(Long alertId);
}
