package com.project.waste.service;
import com.project.waste.enums.UserRole;
import com.project.waste.model.*;
import com.project.waste.repository.*;
import com.project.waste.enums.CollectionStatus;
import com.project.waste.exception.ResourceNotFoundException;
import com.project.waste.exception.InvalidStateTransitionException;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final UserRepository userRepo;
    private final CollectionRequestRepository requestRepo;
    private final ComplaintRepository complaintRepo;
    private final EnterpriseRepository enterpriseRepo;
    private final RequestStatusHistoryRepository requestStatusHistoryRepo;

    public Map<String, Object> getSystemOverview() {
        Map<String, Long> usersByRole = new LinkedHashMap<>();
        for (UserRole role : UserRole.values()) {
            usersByRole.put(role.name(), userRepo.countByRole(role));
        }

        Map<String, Long> requestsByStatus = new LinkedHashMap<>();
        requestRepo.globalCountByStatus()
                .forEach(row -> requestsByStatus.put(row[0].toString(), (Long) row[1]));

        long openComplaints = complaintRepo.findByStatus("OPEN",
                PageRequest.of(0, 1)).getTotalElements();

        return Map.of(
                "totalUsers", userRepo.count(),
                "usersByRole", usersByRole,
                "totalRequests", requestRepo.count(),
                "requestsByStatus", requestsByStatus,
                "openComplaints", openComplaints,
                "totalEnterprises", enterpriseRepo.count()
        );
    }

    public Page<User> getAllUsers(String search, UserRole role, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (search != null && !search.isBlank()) {
            if (role != null) {
                return userRepo.findByRoleAndSearch(role, search.trim(), pageable);
            }
            return userRepo.findBySearch(search.trim(), pageable);
        } else if (role != null) {
            return userRepo.findByRole(role, pageable);
        }
        return userRepo.findAll(pageable);
    }

    public Page<User> getUsersByRole(UserRole role, int page) {
        return getAllUsers(null, role, page, 20);
    }

    @Transactional
    public User toggleUserActive(@NonNull Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));
        userRepo.setActive(userId, !user.isActive());
        user.setActive(!user.isActive());
        return user;
    }

    @Transactional
    public Enterprise verifyEnterprise(@NonNull Long enterpriseId) {
        Enterprise enterprise = enterpriseRepo.findById(enterpriseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enterprise không tồn tại"));
        enterprise.setVerified(true);
        return enterpriseRepo.save(enterprise);
    }

    @Transactional
    public Enterprise rejectEnterprise(@NonNull Long enterpriseId) {
        Enterprise enterprise = enterpriseRepo.findById(enterpriseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enterprise không tồn tại"));
        enterprise.setVerified(false);
        return enterpriseRepo.save(enterprise);
    }

    public Page<Enterprise> getAllEnterprises(String search, Boolean verified, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (search != null && !search.isBlank()) {
            if (verified != null) {
                return enterpriseRepo.findByVerifiedAndSearch(verified, search.trim(), pageable);
            }
            return enterpriseRepo.findBySearch(search.trim(), pageable);
        } else if (verified != null) {
            return enterpriseRepo.findByVerified(verified, pageable);
        }
        return enterpriseRepo.findAll(pageable);
    }

    public Page<Enterprise> getAllEnterprises(int page) {
        return getAllEnterprises(null, null, page, 20);
    }

    public Page<CollectionRequest> getAllRequests(int page) {
        return requestRepo.findAll(
                PageRequest.of(page, 20, Sort.by("createdAt").descending()));
    }


    public Page<Complaint> getOpenComplaints(int page) {
        return complaintRepo.findByStatus("OPEN",
                PageRequest.of(page, 20, Sort.by("createdAt").descending()));
    }

    @Transactional
    public Complaint resolveComplaint(@NonNull Long complaintId, String adminUsername,
                                       String resolution, boolean dismiss) {
        Complaint complaint = complaintRepo.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint không tồn tại"));

        if (!complaint.getStatus().equals("OPEN")) {
            throw new InvalidStateTransitionException("OPEN", complaint.getStatus() + " (already resolved)");
        }

        User admin = userRepo.findByUsername(adminUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Admin không tồn tại"));

        complaint.setStatus(dismiss ? "DISMISSED" : "RESOLVED");
        complaint.setResolvedBy(admin);
        complaint.setResolution(resolution);
        complaint.setResolvedAt(LocalDateTime.now());

        return complaintRepo.save(complaint);
    }

    /**
     * Hủy các yêu cầu {@link CollectionStatus#PENDING} quá hạn (chưa được enterprise xử lý),
     * dùng {@link CollectionRequest#transitionTo} để đảm bảo đúng state machine.
     *
     * @param hoursOld   số giờ tối thiểu kể từ {@code createdAt}
     * @param adminUsername username đăng nhập (principal), dùng cho audit {@code RequestStatusHistory}
     * @return số bản ghi đã chuyển sang {@link CollectionStatus#CANCELLED}
     */
    @Transactional
    public int cancelStaleRequests(int hoursOld, String adminUsername) {
        if (hoursOld <= 0) {
            throw new IllegalArgumentException("hoursOld phải > 0");
        }
        if (adminUsername == null || adminUsername.isBlank()) {
            throw new IllegalArgumentException("adminUsername không hợp lệ");
        }
        User admin = userRepo.findByUsername(adminUsername.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Admin không tồn tại"));

        LocalDateTime cutoff = LocalDateTime.now().minusHours(hoursOld);
        List<CollectionRequest> stale = requestRepo.findByStatusAndCreatedAtBefore(
                CollectionStatus.PENDING, cutoff);

        int count = 0;
        for (CollectionRequest request : stale) {
            CollectionStatus from = request.getStatus();
            request.transitionTo(CollectionStatus.CANCELLED);
            requestRepo.save(request);

            RequestStatusHistory history = RequestStatusHistory.builder()
                    .request(request)
                    .fromStatus(from)
                    .toStatus(CollectionStatus.CANCELLED)
                    .changedBy(admin)
                    .note("Admin cancelled stale PENDING request (older than " + hoursOld + "h)")
                    .build();
            requestStatusHistoryRepo.save(Objects.requireNonNull(history));
            count++;
        }
        return count;
    }
}
