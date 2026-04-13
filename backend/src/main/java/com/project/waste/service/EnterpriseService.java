package com.project.waste.service;

import com.project.waste.dto.EnterpriseComplaintDto;
import com.project.waste.model.*;
import com.project.waste.repository.*;
import com.project.waste.enums.UserRole;
import com.project.waste.enums.WasteType;
import com.project.waste.exception.ResourceNotFoundException;
import com.project.waste.exception.DuplicateResourceException;
import com.project.waste.exception.UnauthorizedActionException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class EnterpriseService {

    private final EnterpriseRepository enterpriseRepo;
    private final EnterpriseCollectorRepository ecRepo;
    private final UserRepository userRepo;
    private final PointRuleRepository pointRuleRepo;
    private final CollectionRequestRepository requestRepo;
    private final ComplaintRepository complaintRepo;
    private final CollectorRepository collectorRepo;

    @Transactional
    public Enterprise getMyEnterprise(String ownerEmail) {
        User owner = findUser(ownerEmail);
        return enterpriseRepo.findByOwnerId(owner.getId())
                .orElseGet(() -> {
                    if (owner.getRole() != UserRole.ENTERPRISE) {
                        throw new ResourceNotFoundException("Enterprise chưa được tạo");
                    }
                    
                    return enterpriseRepo.save(Enterprise.builder()
                            .owner(owner)
                            .companyName((owner.getFullName() == null || owner.getFullName().isBlank()
                                    ? owner.getUsername()
                                    : owner.getFullName()) + " Enterprise")
                            .acceptedWasteTypes("ORGANIC,RECYCLABLE,HAZARDOUS,GENERAL,ELECTRONIC")
                            .serviceArea(owner.getCity())
                            .address(owner.getCity() != null ? owner.getCity() : "TP.HCM")
                            .verified(true)
                            .build());
                });
    }

    @Transactional(readOnly = true)
    public Page<EnterpriseComplaintDto> getMyComplaints(String ownerEmail, int page) {
        Enterprise enterprise = getMyEnterprise(ownerEmail);
        return complaintRepo.findByEnterpriseId(enterprise.getId(), PageRequest.of(page, 20))
                .map(this::toEnterpriseComplaintDto);
    }

    @Transactional
    public EnterpriseComplaintDto resolveComplaint(String ownerEmail, Long complaintId, String resolution) {
        Enterprise enterprise = getMyEnterprise(ownerEmail);
        Complaint complaint = complaintRepo.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khiếu nại"));

        if (!complaint.getRequest().getEnterprise().getId().equals(enterprise.getId())) {
            throw new UnauthorizedActionException("Bạn không có quyền xử lý khiếu nại này");
        }

        complaint.setStatus("RESOLVED");
        complaint.setResolution(resolution);
        complaint.setResolvedBy(enterprise.getOwner());
        complaint.setResolvedAt(LocalDateTime.now());

        return toEnterpriseComplaintDto(complaintRepo.save(complaint));
    }

    @Transactional
    public Enterprise registerEnterprise(String ownerEmail, String companyName,
                                          String acceptedWasteTypes, String serviceArea,
                                          Integer maxCapacityKg, String address) {
        User owner = findUser(ownerEmail);
        if (enterpriseRepo.findByOwnerId(owner.getId()).isPresent()) {
            throw new DuplicateResourceException("Bạn đã có enterprise rồi");
        }
        return enterpriseRepo.save(Objects.requireNonNull(Enterprise.builder()
                .owner(owner)
                .companyName(companyName)
                .acceptedWasteTypes(acceptedWasteTypes)
                .serviceArea(serviceArea)
                .maxCapacityKg(maxCapacityKg)
                .address(address)
                .verified(true) 
                .build()));
    }

    @Transactional
    public void addCollector(String ownerEmail, @NonNull Long collectorId) {
        Enterprise enterprise = getMyEnterprise(ownerEmail);
        User collectorUser = userRepo.findById(collectorId)
                .orElseThrow(() -> new ResourceNotFoundException("Collector không tồn tại"));

        if (collectorUser.getRole() != UserRole.COLLECTOR) {
            throw new UnauthorizedActionException("User này không phải Collector");
        }
        if (ecRepo.existsByEnterpriseIdAndCollectorId(enterprise.getId(), collectorId)) {
            throw new DuplicateResourceException("Collector đã thuộc enterprise này");
        }

        EnterpriseCollector.EnterpriseCollectorId id =
                new EnterpriseCollector.EnterpriseCollectorId(enterprise.getId(), collectorId);
        ecRepo.save(Objects.requireNonNull(EnterpriseCollector.builder()
                .id(id).enterprise(enterprise).collector(collectorUser).build()));

        
        if (collectorRepo.findByUserId(collectorId).isEmpty()) {
            collectorRepo.save(new Collector(null, enterprise.getId(), collectorId));
        }
    }

    @Transactional
    public void removeCollector(String ownerEmail, @NonNull Long collectorId) {
        Enterprise enterprise = getMyEnterprise(ownerEmail);
        EnterpriseCollector.EnterpriseCollectorId id =
                new EnterpriseCollector.EnterpriseCollectorId(enterprise.getId(), collectorId);
        if (!ecRepo.existsById(id)) {
            throw new ResourceNotFoundException("Collector không thuộc enterprise này");
        }
        ecRepo.deleteById(id);
    }


    public List<User> getMyCollectors(String ownerEmail) {
        Enterprise enterprise = getMyEnterprise(ownerEmail);
        List<User> mappedCollectors = ecRepo.findCollectorsByEnterpriseId(enterprise.getId());
        if (!mappedCollectors.isEmpty()) {
            return mappedCollectors;
        }
        
        return userRepo.findByRole(UserRole.COLLECTOR);
    }

    @Transactional
    public PointRule upsertPointRule(String ownerEmail, WasteType wasteType,
                                      int basePoints, int bonusPoints, String bonusCondition) {
        Enterprise enterprise = getMyEnterprise(ownerEmail);

        pointRuleRepo.findByEnterpriseIdAndWasteTypeAndActiveTrue(enterprise.getId(), wasteType)
                .ifPresent(old -> { old.setActive(false); pointRuleRepo.save(old); });

        return pointRuleRepo.save(Objects.requireNonNull(PointRule.builder()
                .enterprise(enterprise)
                .wasteType(wasteType)
                .basePoints(basePoints)
                .bonusPoints(bonusPoints)
                .bonusCondition(bonusCondition)
                .active(true)
                .build()));
    }

    public List<PointRule> getMyPointRules(String ownerEmail) {
        Enterprise enterprise = getMyEnterprise(ownerEmail);
        return pointRuleRepo.findByEnterpriseIdAndActiveTrue(enterprise.getId());
    }

    public Map<String, Object> getStats(String ownerEmail) {
        Enterprise enterprise = getMyEnterprise(ownerEmail);
        Long eid = enterprise.getId();

        Map<String, Long> byWasteType = new LinkedHashMap<>();
        requestRepo.countCollectedByWasteType(eid)
                .forEach(row -> {
                    if (row[0] != null && row[1] != null) {
                        byWasteType.put(row[0].toString(), ((Number) row[1]).longValue());
                    }
                });

        Map<String, Long> byStatus = new LinkedHashMap<>();
        requestRepo.countByStatusForEnterprise(eid)
                .forEach(row -> {
                    if (row[0] != null && row[1] != null) {
                        byStatus.put(row[0].toString(), ((Number) row[1]).longValue());
                    }
                });

        Map<String, Long> byDay = new LinkedHashMap<>();
        requestRepo.countByDay(eid, LocalDateTime.now().minusDays(30))
                .forEach(row -> {
                    if (row[0] != null && row[1] != null) {
                        byDay.put(row[0].toString(), ((Number) row[1]).longValue());
                    }
                });

        return Map.of(
                "byWasteType", byWasteType,
                "byStatus", byStatus,
                "last30Days", byDay
        );
    }

    private User findUser(String principal) {
        return userRepo.findByEmail(principal)
                .or(() -> userRepo.findByUsername(principal))
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));
    }

    private EnterpriseComplaintDto toEnterpriseComplaintDto(Complaint complaint) {
        Long requestId = complaint.getRequest() != null ? complaint.getRequest().getId() : null;
        Long citizenId = complaint.getCitizen() != null ? complaint.getCitizen().getId() : null;
        String citizenFullName = complaint.getCitizen() != null ? complaint.getCitizen().getFullName() : null;

        return new EnterpriseComplaintDto(
                complaint.getId(),
                requestId,
                citizenId,
                citizenFullName,
                complaint.getTitle(),
                complaint.getContent(),
                complaint.getStatus(),
                complaint.getResolution(),
                complaint.getCreatedAt(),
                complaint.getResolvedAt()
        );
    }
}
