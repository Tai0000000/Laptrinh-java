package com.project.waste.repository;

import com.project.waste.model.RequestStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RequestStatusHistoryRepository extends JpaRepository<RequestStatusHistory, Long> {
    List<RequestStatusHistory> findByRequestIdOrderByChangedAtAsc(Long requestId);
}
