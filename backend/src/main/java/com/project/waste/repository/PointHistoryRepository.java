package com.project.waste.repository;

import com.project.waste.model.PointHistory;
import com.project.waste.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PointHistoryRepository extends JpaRepository<PointHistory, Long> {
    Page<PointHistory> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    List<PointHistory> findAllByUserId(Long userId);
}
