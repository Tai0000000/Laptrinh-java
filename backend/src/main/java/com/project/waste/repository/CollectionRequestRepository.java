package com.project.waste.repository;

import com.project.waste.model.CollectionRequest;
import com.project.waste.enums.CollectionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CollectionRequestRepository extends JpaRepository<CollectionRequest, Long> {

    Page<CollectionRequest> findByCitizen_Id(Long citizenId, Pageable pageable);
    List<CollectionRequest> findByStatusOrderByCreatedAtAsc(CollectionStatus status);
    Page<CollectionRequest> findByEnterprise_Id(Long enterpriseId, Pageable pageable);
    Page<CollectionRequest> findByAssignedCollector_Id(Long collectorId, Pageable pageable);

    @Query("SELECT r FROM CollectionRequest r WHERE r.assignedCollector.id = :cid " +
           "AND r.status IN ('ASSIGNED', 'ON_THE_WAY') ORDER BY r.createdAt ASC")
    List<CollectionRequest> findActiveTasksByCollector(@Param("cid") Long collectorId);

    @Query("SELECT r FROM CollectionRequest r WHERE r.assignedCollector.id = :cid " +
           "AND r.status = 'COLLECTED' ORDER BY r.updatedAt DESC")
    Page<CollectionRequest> findHistoryByCollector(@Param("cid") Long collectorId, Pageable pageable);

    @Query("SELECT r.wasteType, COUNT(r) FROM CollectionRequest r " +
           "WHERE r.enterprise.id = :eid AND r.status = 'COLLECTED' " +
           "GROUP BY r.wasteType")
    List<Object[]> countCollectedByWasteType(@Param("eid") Long enterpriseId);

    @Query("SELECT CAST(r.createdAt AS date), COUNT(r) FROM CollectionRequest r " +
           "WHERE r.enterprise.id = :eid AND r.createdAt >= :since " +
           "GROUP BY CAST(r.createdAt AS date) ORDER BY CAST(r.createdAt AS date)")
    List<Object[]> countByDay(@Param("eid") Long enterpriseId, @Param("since") LocalDateTime since);

    @Query("SELECT r.status, COUNT(r) FROM CollectionRequest r " +
           "WHERE r.enterprise.id = :eid GROUP BY r.status")
    List<Object[]> countByStatusForEnterprise(@Param("eid") Long enterpriseId);

    List<CollectionRequest> findByEnterprise_IdAndStatusOrderByCreatedAtAsc(
            Long enterpriseId, CollectionStatus status);

    @Query("SELECT r.status, COUNT(r) FROM CollectionRequest r GROUP BY r.status")
    List<Object[]> globalCountByStatus();

    long countByStatus(CollectionStatus status);

    List<CollectionRequest> findByStatusAndCreatedAtBefore(CollectionStatus status, LocalDateTime createdAt);
}