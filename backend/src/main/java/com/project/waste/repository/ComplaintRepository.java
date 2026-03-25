package com.project.waste.repository;

import com.project.waste.model.Complaint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    Page<Complaint> findByCitizenId(Long citizenId, Pageable pageable);
    Page<Complaint> findByStatus(String status, Pageable pageable);
    List<Complaint> findByRequestId(Long requestId);
}

