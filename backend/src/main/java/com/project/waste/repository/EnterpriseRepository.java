package com.project.waste.repository;

import com.project.waste.model.Enterprise;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface EnterpriseRepository extends JpaRepository<Enterprise, Long> {
    Optional<Enterprise> findByOwnerId(Long ownerId);

    Page<Enterprise> findByVerified(boolean verified, Pageable pageable);

    @Query("SELECT e FROM Enterprise e WHERE LOWER(e.companyName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(e.address) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Enterprise> findBySearch(@Param("search") String search, Pageable pageable);

    @Query("SELECT e FROM Enterprise e WHERE (LOWER(e.companyName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(e.address) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND e.verified = :verified")
    Page<Enterprise> findByVerifiedAndSearch(@Param("verified") boolean verified, @Param("search") String search, Pageable pageable);
}