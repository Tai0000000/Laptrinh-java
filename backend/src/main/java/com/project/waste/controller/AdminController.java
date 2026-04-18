package com.project.waste.controller;

import com.project.waste.dto.AdminEnterpriseDto;
import com.project.waste.dto.EnterpriseComplaintDto;
import com.project.waste.enums.UserRole;
import com.project.waste.model.*;
import com.project.waste.repository.CollectionRequestRepository;
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

    private final CollectionRequestRepository requestRepository;

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> overview() {
        return ResponseEntity.ok(adminService.getSystemOverview());
    }

    @GetMapping("/users")
    public ResponseEntity<Page<User>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAllUsers(search, role, page, size));
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

    @GetMapping("/requests")
    public ResponseEntity<Page<CollectionRequest>> getAllRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "200") int size) {
        return ResponseEntity.ok(adminService.getAllRequests(page, size));
    }

    


    @PostMapping("/requests/cancel-stale")
    public ResponseEntity<Map<String, Integer>> cancelStaleRequests(
            @RequestParam(defaultValue = "72") int hoursOld,
            @AuthenticationPrincipal UserDetails ud) {
        int cancelled = adminService.cancelStaleRequests(hoursOld, ud.getUsername());
        return ResponseEntity.ok(Map.of("cancelled", cancelled));
    }

    @GetMapping("/enterprises")
    public ResponseEntity<Page<AdminEnterpriseDto>> getAllEnterprises(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAllEnterprises(search, page, size));
    }

    @GetMapping("/complaints")
    public ResponseEntity<?> getComplaints(@RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(adminService.getAllComplaints(page));
    }

    @PostMapping("/complaints/{id}/resolve")
    public ResponseEntity<EnterpriseComplaintDto> resolveComplaint(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {
        boolean dismiss = Boolean.TRUE.equals(body.get("dismiss"));
        return ResponseEntity.ok(adminService.resolveComplaint(
                id, ud.getUsername(), (String) body.get("resolution"), dismiss));
    }

    // hủy yêu cầu
    @PutMapping("/requests/{id}/status")
    public ResponseEntity<?> updateRequestStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> requestBody,
            @AuthenticationPrincipal UserDetails ud) {

        String newStatus = requestBody.get("status");
        String note = requestBody.get("note");

        adminService.updateRequestStatus(id, newStatus, note, ud.getUsername());

        return ResponseEntity.ok("Cập nhật trạng thái thành công");
    }
}
