package com.project.waste.controller;

import com.project.waste.dto.EnterpriseComplaintDto;
import com.project.waste.enums.WasteType;
import com.project.waste.model.*;
import com.project.waste.service.EnterpriseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/enterprise")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ENTERPRISE')")
public class EnterpriseController {

    private final EnterpriseService enterpriseService;

    @GetMapping("/me")
    public ResponseEntity<Enterprise> getMyEnterprise(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(enterpriseService.getMyEnterprise(ud.getUsername()));
    }

    @GetMapping("/complaints")
    public ResponseEntity<Page<EnterpriseComplaintDto>> getComplaints(
            @RequestParam(defaultValue = "0") int page,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(enterpriseService.getMyComplaints(ud.getUsername(), page));
    }

    @PostMapping("/complaints/{complaintId}/resolve")
    public ResponseEntity<EnterpriseComplaintDto> resolveComplaint(
            @PathVariable Long complaintId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(enterpriseService.resolveComplaint(
                ud.getUsername(), complaintId, body.get("resolution")));
    }

    @PostMapping("/register")
    public ResponseEntity<Enterprise> register(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(enterpriseService.registerEnterprise(
                ud.getUsername(),
                (String) body.get("companyName"),
                (String) body.get("acceptedWasteTypes"),
                (String) body.get("serviceArea"),
                body.get("maxCapacityKg") != null ? Integer.parseInt(body.get("maxCapacityKg").toString()) : null,
                (String) body.get("address")
        ));
    }

    @GetMapping("/collectors")
    public ResponseEntity<List<User>> getCollectors(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(enterpriseService.getMyCollectors(ud.getUsername()));
    }

    @PostMapping("/collectors/{collectorId}")
    public ResponseEntity<?> addCollector(
            @PathVariable Long collectorId,
            @AuthenticationPrincipal UserDetails ud) {
        enterpriseService.addCollector(ud.getUsername(), collectorId);
        return ResponseEntity.ok(Map.of("message", "Collector đã được thêm"));
    }

    @DeleteMapping("/collectors/{collectorId}")
    public ResponseEntity<?> removeCollector(
            @PathVariable Long collectorId,
            @AuthenticationPrincipal UserDetails ud) {
        enterpriseService.removeCollector(ud.getUsername(), collectorId);
        return ResponseEntity.ok(Map.of("message", "Collector đã được xóa"));
    }


    @GetMapping("/point-rules")
    public ResponseEntity<List<PointRule>> getPointRules(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(enterpriseService.getMyPointRules(ud.getUsername()));
    }

    @PostMapping("/point-rules")
    public ResponseEntity<PointRule> upsertPointRule(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(enterpriseService.upsertPointRule(
                ud.getUsername(),
                WasteType.valueOf((String) body.get("wasteType")),
                Integer.parseInt(body.get("basePoints").toString()),
                body.get("bonusPoints") != null ? Integer.parseInt(body.get("bonusPoints").toString()) : 0,
                (String) body.get("bonusCondition")
        ));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(enterpriseService.getStats(ud.getUsername()));
    }
}
