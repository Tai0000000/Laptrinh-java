package com.project.waste.repository;

import com.project.waste.model.Collector;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CollectorRepository extends JpaRepository<Collector, Long> {
    boolean existsByIdAndEnterpriseId(Long id, Long enterpriseId);
    Optional<Collector> findByUserId(Long userId);
    Optional<Collector> findByUserIdAndEnterpriseId(Long userId, Long enterpriseId);
}
