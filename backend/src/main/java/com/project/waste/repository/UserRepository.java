package com.project.waste.repository;

import com.project.waste.model.User;
import com.project.waste.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    Page<User> findByRole(UserRole role, Pageable pageable);
    List<User> findAllByOrderByTotalPointsDesc();

    @Query("SELECT u FROM User u WHERE u.role = 'CITIZEN' ORDER BY u.totalPoints DESC")
    List<User> findTopCitizens(Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role = 'CITIZEN' AND LOWER(u.city) LIKE LOWER(CONCAT('%', :city, '%')) ORDER BY u.totalPoints DESC")
    List<User> findTopCitizensByCity(@Param("city") String city, Pageable pageable);

    @Modifying
    @Query("UPDATE User u SET u.totalPoints = u.totalPoints + :points WHERE u.id = :userId")
    void addPoints(@Param("userId") Long userId, @Param("points") int points);

    @Modifying
    @Query("UPDATE User u SET u.active = :active WHERE u.id = :userId")
    void setActive(@Param("userId") Long userId, @Param("active") boolean active);

    long countByRole(UserRole role);
}
