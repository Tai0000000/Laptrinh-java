package com.project.waste.repository;

import com.project.waste.model.Collector;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CollectorRepository extends JpaRepository<Collector, Long> {
    boolean existsByIdAndEnterpriseId(Long id, Long enterpriseId);
}