package com.project.waste.repository;

import com.project.waste.model.EnterpriseCollector;
import com.project.waste.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface EnterpriseCollectorRepository
        extends JpaRepository<EnterpriseCollector, EnterpriseCollector.EnterpriseCollectorId> {

    List<EnterpriseCollector> findByEnterpriseId(Long enterpriseId);

    boolean existsByEnterpriseIdAndCollectorId(Long enterpriseId, Long collectorId);

    @Query("SELECT ec.collector FROM EnterpriseCollector ec WHERE ec.enterprise.id = :enterpriseId")
    List<User> findCollectorsByEnterpriseId(Long enterpriseId);
}
