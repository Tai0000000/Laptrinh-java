package com.project.waste.controller;
import com.project.waste.model.CollectionRequest;
import com.project.waste.model.RequestStatusHistory;
import com.project.waste.service.CollectionRequestService;
import com.project.waste.repository.RequestStatusHistoryRepository;
import com.project.waste.dto.CreateCollectionRequest;
import jakarta.validation.Valid;
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
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class CollectionRequestController {

    private final CollectionRequestService service;
    private final RequestStatusHistoryRepository historyRepo;

    @PostMapping
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<CollectionRequest> createRequest(
            @Valid @RequestBody CreateCollectionRequest dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(service.createRequest(userDetails.getUsername(), dto));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<Page<CollectionRequest>> myRequests(
            @RequestParam(defaultValue = "0") int page,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(service.getMyCitizenRequests(userDetails.getUsername(), page));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ENTERPRISE')")
    public ResponseEntity<List<CollectionRequest>> getPendingRequests() {
        return ResponseEntity.ok(service.getPendingRequests());
    }

    @GetMapping("/accepted")
    @PreAuthorize("hasRole('ENTERPRISE')")
    public ResponseEntity<List<CollectionRequest>> getAcceptedRequests(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(service.getAcceptedRequests(userDetails.getUsername()));
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasRole('ENTERPRISE')")
    public ResponseEntity<CollectionRequest> acceptRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(service.acceptRequest(id, userDetails.getUsername()));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ENTERPRISE')")
    public ResponseEntity<CollectionRequest> rejectRequest(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
            service.rejectRequest(id, userDetails.getUsername(), body.get("reason")));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasRole('ENTERPRISE')")
    public ResponseEntity<CollectionRequest> assignCollector(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
            service.assignCollector(id, body.get("collectorId"), userDetails.getUsername()));
    }

    @GetMapping("/my-tasks")
    @PreAuthorize("hasRole('COLLECTOR')")
    public ResponseEntity<Page<CollectionRequest>> myTasks(
            @RequestParam(defaultValue = "0") int page,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(service.getMyCollectorTasks(userDetails.getUsername(), page));
    }

    @GetMapping("/active-tasks")
    @PreAuthorize("hasRole('COLLECTOR')")
    public ResponseEntity<List<CollectionRequest>> activeTasks(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(service.getActiveCollectorTasks(userDetails.getUsername()));
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('COLLECTOR')")
    public ResponseEntity<Page<CollectionRequest>> collectorHistory(
            @RequestParam(defaultValue = "0") int page,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(service.getCollectorHistory(userDetails.getUsername(), page));
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasRole('COLLECTOR')")
    public ResponseEntity<CollectionRequest> startCollection(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(service.startCollection(id, userDetails.getUsername()));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasRole('COLLECTOR')")
    public ResponseEntity<CollectionRequest> completeCollection(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
            service.completeCollection(id, userDetails.getUsername(), body.get("proofImageUrl")));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<RequestStatusHistory>> getHistory(@PathVariable Long id) {
        return ResponseEntity.ok(historyRepo.findByRequestIdOrderByChangedAtAsc(id));
    }
}
