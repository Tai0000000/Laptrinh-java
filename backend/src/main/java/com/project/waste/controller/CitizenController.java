package com.project.waste.controller;

import com.project.waste.dto.CollectionRequestDto;
import com.project.waste.dto.RequestStatusHistoryDto;
import com.project.waste.model.Complaint;
import com.project.waste.model.PointHistory;
import com.project.waste.model.User;
import com.project.waste.service.CitizenService;
import com.project.waste.repository.CollectionRequestRepository;
import com.project.waste.repository.RequestStatusHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.util.List;

@RestController
@RequestMapping("/api/citizen") 
public class CitizenController {

    @Autowired
    private CitizenService citizenService;

    @Autowired
    private CollectionRequestRepository collectionRequestRepository;

    @Autowired
    private RequestStatusHistoryRepository requestStatusHistoryRepository;

    // Link cho tinh nang xem tong diem
    @GetMapping("/points/{userId}") 
    public Integer getTotalPoints(@PathVariable Long userId) { 
        return citizenService.getTotalPoints(userId);
    }
    // Link xem lich su diem
    @GetMapping("/history/{userId}")
    public List<PointHistory> getPointHistory(@PathVariable Long userId) {
        return citizenService.getPointHistory(userId);
    }
    // link xem BXH
    @GetMapping("/leaderboard")
    public List<User> getLeaderboard() {
        return citizenService.getLeaderboard();
    }
    //link tao phieu Complaint
    @PostMapping("/complaint")
    public Complaint createComplaint(
            @RequestParam Long userId, 
            @RequestParam String title,
            @RequestParam String content) {

        return citizenService.createComplaint(userId, title, content);
    }

    // Citizen Dashboard: Requests + Status Timeline
    @GetMapping("/requests/{userId}")
    public List<CollectionRequestDto> getCitizenRequests(@PathVariable Long userId) {
        var pageable = PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "createdAt"));
        return collectionRequestRepository.findByCitizen_Id(userId, pageable)
                .getContent()
                .stream()
                .map(r -> new CollectionRequestDto(
                        r.getId(),
                        r.getWasteType() != null ? r.getWasteType().name() : null,
                        r.getDescription(),
                        r.getPhotoUrl(),
                        r.getEnterpriseId(),
                        r.getCollectorId(),
                        r.getStatus() != null ? r.getStatus().name() : null,
                        r.getCreatedAt()
                ))
                .toList();
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