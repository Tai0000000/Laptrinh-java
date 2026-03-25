package com.project.waste.repository;

import com.project.waste.model.Enterprise;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EnterpriseRepository extends JpaRepository<Enterprise, Long> {
    Optional<Enterprise> findByOwnerId(Long ownerId);
}