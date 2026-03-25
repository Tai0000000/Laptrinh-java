package com.project.waste.repository;

import com.project.waste.model.PointRule;
import com.project.waste.enums.WasteType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PointRuleRepository extends JpaRepository<PointRule, Long> {
    Optional<PointRule> findByEnterpriseIdAndWasteTypeAndActiveTrue(Long enterpriseId, WasteType wasteType);
    List<PointRule> findByEnterpriseIdAndActiveTrue(Long enterpriseId);
}