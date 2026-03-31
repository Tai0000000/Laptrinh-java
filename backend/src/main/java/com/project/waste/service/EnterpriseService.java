package com.project.waste.service;

import com.project.waste.model.*;
import com.project.waste.repository.*;
import com.project.waste.enums.UserRole;
import com.project.waste.enums.WasteType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
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

    public Enterprise getMyEnterprise(String ownerEmail) {
        User owner = findUser(ownerEmail);
        return enterpriseRepo.findByOwnerId(owner.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Enterprise chưa được tạo"));
    }

    @Transactional
    public Enterprise registerEnterprise(String ownerEmail, String companyName,
                                          String acceptedWasteTypes, String serviceArea,
                                          Integer maxCapacityKg, String address) {
        User owner = findUser(ownerEmail);
        if (enterpriseRepo.findByOwnerId(owner.getId()).isPresent()) {
            throw new DuplicateResourceException("Bạn đã có enterprise rồi");
        }
        return enterpriseRepo.save(Enterprise.builder()
                .owner(owner)
                .companyName(companyName)
                .acceptedWasteTypes(acceptedWasteTypes)
                .serviceArea(serviceArea)
                .maxCapacityKg(maxCapacityKg)
                .address(address)
                .build());
    }

    @Transactional
    public void addCollector(String ownerEmail, Long collectorId) {
        Enterprise enterprise = getMyEnterprise(ownerEmail);
        User collector = userRepo.findById(collectorId)
                .orElseThrow(() -> new ResourceNotFoundException("Collector không tồn tại"));

        if (collector.getRole() != UserRole.COLLECTOR) {
            throw new UnauthorizedActionException("User này không phải Collector");
        }
        if (ecRepo.existsByEnterpriseIdAndCollectorId(enterprise.getId(), collectorId)) {
            throw new DuplicateResourceException("Collector đã thuộc enterprise này");
        }

        EnterpriseCollector.EnterpriseCollectorId id =
                new EnterpriseCollector.EnterpriseCollectorId(enterprise.getId(), collectorId);
        ecRepo.save(EnterpriseCollector.builder()
                .id(id).enterprise(enterprise).collector(collector).build());
    }

    @Transactional
    public void removeCollector(String ownerEmail, Long collectorId) {
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
        return ecRepo.findCollectorsByEnterpriseId(enterprise.getId());
    }

    @Transactional
    public PointRule upsertPointRule(String ownerEmail, WasteType wasteType,
                                      int basePoints, int bonusPoints, String bonusCondition) {
        Enterprise enterprise = getMyEnterprise(ownerEmail);

        pointRuleRepo.findByEnterpriseIdAndWasteTypeAndActiveTrue(enterprise.getId(), wasteType)
                .ifPresent(old -> { old.setActive(false); pointRuleRepo.save(old); });

        return pointRuleRepo.save(PointRule.builder()
                .enterprise(enterprise)
                .wasteType(wasteType)
                .basePoints(basePoints)
                .bonusPoints(bonusPoints)
                .bonusCondition(bonusCondition)
                .active(true)
                .build());
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
                .forEach(row -> byWasteType.put(row[0].toString(), (Long) row[1]));

        Map<String, Long> byStatus = new LinkedHashMap<>();
        requestRepo.countByStatusForEnterprise(eid)
                .forEach(row -> byStatus.put(row[0].toString(), (Long) row[1]));

        Map<String, Long> byDay = new LinkedHashMap<>();
        requestRepo.countByDay(eid, LocalDateTime.now().minusDays(30))
                .forEach(row -> byDay.put(row[0].toString(), (Long) row[1]));

        return Map.of(
                "byWasteType", byWasteType,
                "byStatus", byStatus,
                "last30Days", byDay
        );
    }

    private User findUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));
    }
}
