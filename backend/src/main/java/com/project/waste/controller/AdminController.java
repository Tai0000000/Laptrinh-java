package com.project.waste.controller;

import com.project.waste.enums.UserRole;
import com.project.waste.model.*;
import com.project.waste.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> overview() {
        return ResponseEntity.ok(adminService.getSystemOverview());
    }

    @GetMapping("/users")
    public ResponseEntity<Page<User>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAllUsers(page, size));
    }

    @GetMapping("/users/role/{role}")
    public ResponseEntity<Page<User>> getUsersByRole(
            @PathVariable UserRole role,
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(adminService.getUsersByRole(role, page));
    }

    @PatchMapping("/users/{userId}/toggle-active")
    public ResponseEntity<User> toggleUserActive(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.toggleUserActive(userId));
    }

    @PatchMapping("/enterprises/{enterpriseId}/verify")
    public ResponseEntity<Enterprise> verifyEnterprise(@PathVariable Long enterpriseId) {
        return ResponseEntity.ok(adminService.verifyEnterprise(enterpriseId));
    }

    @PatchMapping("/enterprises/{enterpriseId}/reject")
    public ResponseEntity<Enterprise> rejectEnterprise(@PathVariable Long enterpriseId) {
        return ResponseEntity.ok(adminService.rejectEnterprise(enterpriseId));
    }

    @GetMapping("/requests")
    public ResponseEntity<Page<CollectionRequest>> getAllRequests(
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(adminService.getAllRequests(page));
    }

    /**
     * Hủy các yêu cầu PENDING quá hạn (theo {@code createdAt}), chuyển sang CANCELLED qua state machine.
     */
    @PostMapping("/requests/cancel-stale")
    public ResponseEntity<Map<String, Integer>> cancelStaleRequests(
            @RequestParam(defaultValue = "72") int hoursOld,
            @AuthenticationPrincipal UserDetails ud) {
        int cancelled = adminService.cancelStaleRequests(hoursOld, ud.getUsername());
        return ResponseEntity.ok(Map.of("cancelled", cancelled));
    }

    @GetMapping("/enterprises")
    public ResponseEntity<Page<Enterprise>> getAllEnterprises(
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(adminService.getAllEnterprises(page));
    }

    @GetMapping("/complaints")
    public ResponseEntity<Page<Complaint>> getOpenComplaints(
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(adminService.getOpenComplaints(page));
    }

    @PostMapping("/complaints/{id}/resolve")
    public ResponseEntity<Complaint> resolveComplaint(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {
        boolean dismiss = Boolean.TRUE.equals(body.get("dismiss"));
        return ResponseEntity.ok(adminService.resolveComplaint(
                id, ud.getUsername(), (String) body.get("resolution"), dismiss));
    }
}
