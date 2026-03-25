package com.project.waste.repository;

import com.project.waste.model.PointTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PointTransactionRepository extends JpaRepository<PointTransaction, Long> {
    Page<PointTransaction> findByCitizenIdOrderByCreatedAtDesc(Long citizenId, Pageable pageable);
}
