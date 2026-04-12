package com.project.waste.repository;

import com.project.waste.model.Complaint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    Page<Complaint> findByCitizenId(Long citizenId, Pageable pageable);
    Page<Complaint> findByStatus(String status, Pageable pageable);
    long countByStatus(String status);
    List<Complaint> findByRequestId(Long requestId);
    
    @Query("SELECT c FROM Complaint c JOIN c.request r WHERE r.enterprise.id = :enterpriseId")
    Page<Complaint> findByEnterpriseId(@Param("enterpriseId") Long enterpriseId, Pageable pageable);
}

