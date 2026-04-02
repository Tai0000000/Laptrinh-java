package com.project.waste.service;
import com.project.waste.enums.UserRole;
import com.project.waste.model.*;   
import com.project.waste.repository.*;
import com.project.waste.enums.CollectionStatus;
import com.project.waste.exception.ResourceNotFoundException;
import com.project.waste.exception.InvalidStateTransitionException;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
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

    public Page<User> getAllUsers(int page, int size) {
        return userRepo.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    public Page<User> getUsersByRole(UserRole role, int page) {
        return userRepo.findByRole(role, PageRequest.of(page, 20, Sort.by("createdAt").descending()));
    }

    @Transactional
    public User toggleUserActive(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));
        userRepo.setActive(userId, !user.isActive());
        user.setActive(!user.isActive());
        return user;
    }

    @Transactional
    public Enterprise verifyEnterprise(Long enterpriseId) {
        Enterprise enterprise = enterpriseRepo.findById(enterpriseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enterprise không tồn tại"));
        enterprise.setVerified(true);
        return enterpriseRepo.save(enterprise);
    }

    @Transactional
    public Enterprise rejectEnterprise(Long enterpriseId) {
        Enterprise enterprise = enterpriseRepo.findById(enterpriseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enterprise không tồn tại"));
        enterprise.setVerified(false);
        return enterpriseRepo.save(enterprise);
    }

    public Page<Enterprise> getAllEnterprises(int page) {
        return enterpriseRepo.findAll(
                PageRequest.of(page, 20, Sort.by("createdAt").descending()));
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
    public Complaint resolveComplaint(Long complaintId, String adminEmail,
                                       String resolution, boolean dismiss) {
        Complaint complaint = complaintRepo.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint không tồn tại"));

        if (!complaint.getStatus().equals("OPEN")) {
            throw new InvalidStateTransitionException("OPEN", complaint.getStatus() + " (already resolved)");
        }

        User admin = userRepo.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin không tồn tại"));

        complaint.setStatus(dismiss ? "DISMISSED" : "RESOLVED");
        complaint.setResolvedBy(admin);
        complaint.setResolution(resolution);
        complaint.setResolvedAt(LocalDateTime.now());

        return complaintRepo.save(complaint);
    }

    @Transactional
    public int cancelStaleRequests(int hoursOld) {
        return 0;
    }
}
