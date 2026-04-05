package com.project.waste.controller;

import com.project.waste.dto.CitizenComplaintDto;
import com.project.waste.dto.CitizenLeaderboardEntryDto;
import com.project.waste.dto.CitizenPointHistoryDto;
import com.project.waste.dto.CitizenSummaryDto;
import com.project.waste.dto.CollectionRequestDto;
import com.project.waste.dto.CreateCitizenComplaintRequest;
import com.project.waste.dto.RequestStatusHistoryDto;
import com.project.waste.service.CitizenService;
import com.project.waste.repository.RequestStatusHistoryRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/citizen")
@PreAuthorize("hasRole('CITIZEN')")
public class CitizenController {

    @Autowired
    private CitizenService citizenService;

    @Autowired
    private RequestStatusHistoryRepository requestStatusHistoryRepository;

    @GetMapping("/points/{userId}")
    public Integer getTotalPoints(@PathVariable Long userId) {
        return citizenService.getTotalPoints(userId);
    }

    @GetMapping("/history/{userId}")
    public List<CitizenPointHistoryDto> getPointHistory(@PathVariable Long userId) {
        return citizenService.getPointHistory(userId);
    }

    @GetMapping("/leaderboard")
    public List<CitizenLeaderboardEntryDto> getLeaderboard() {
        return citizenService.getLeaderboard();
    }

    @GetMapping("/me/summary")
    public CitizenSummaryDto getMySummary(@AuthenticationPrincipal UserDetails userDetails) {
        return citizenService.getSummary(userDetails.getUsername());
    }

    @GetMapping("/me/points")
    public Integer getMyPoints(@AuthenticationPrincipal UserDetails userDetails) {
        return citizenService.getTotalPoints(userDetails.getUsername());
    }

    @GetMapping("/me/point-history")
    public List<CitizenPointHistoryDto> getMyPointHistory(@AuthenticationPrincipal UserDetails userDetails) {
        return citizenService.getPointHistory(userDetails.getUsername());
    }

    @GetMapping("/me/requests")
    public List<CollectionRequestDto> getMyRequests(@AuthenticationPrincipal UserDetails userDetails) {
        return citizenService.getCitizenRequests(userDetails.getUsername());
    }

    @GetMapping("/me/complaints")
    public List<CitizenComplaintDto> getMyComplaints(@AuthenticationPrincipal UserDetails userDetails) {
        return citizenService.getComplaints(userDetails.getUsername());
    }

    @PostMapping("/complaints")
    public CitizenComplaintDto createComplaint(
            @Valid @RequestBody CreateCitizenComplaintRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return citizenService.createComplaint(userDetails.getUsername(), request);
    }

    @GetMapping("/requests/{userId}")
    public List<CollectionRequestDto> getCitizenRequests(@PathVariable Long userId) {
        return citizenService.getCitizenRequests(userId);
    }

    @GetMapping("/requests/{requestId}/status-history")
    public List<RequestStatusHistoryDto> getRequestStatusHistory(@PathVariable Long requestId) {
        return requestStatusHistoryRepository.findByRequestIdOrderByChangedAtAsc(requestId)
                .stream()
                .map(h -> new RequestStatusHistoryDto(
                        h.getFromStatus() != null ? h.getFromStatus().name() : null,
                        h.getToStatus() != null ? h.getToStatus().name() : null,
                        h.getChangedAt(),
                        h.getChangedBy() != null ? h.getChangedBy().getId() : null,
                        h.getChangedBy() != null ? h.getChangedBy().getFullName() : null
                ))
                .toList();
    }
}
