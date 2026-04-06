package com.project.waste.service;

import com.project.waste.dto.CitizenComplaintDto;
import com.project.waste.dto.CitizenLeaderboardEntryDto;
import com.project.waste.dto.CitizenPointHistoryDto;
import com.project.waste.dto.CitizenSummaryDto;
import com.project.waste.dto.CollectionRequestDto;
import com.project.waste.dto.CreateCitizenComplaintRequest;
import com.project.waste.model.CollectionRequest;
import com.project.waste.model.Complaint;
import com.project.waste.model.PointHistory;
import com.project.waste.model.User;
import com.project.waste.repository.CollectionRequestRepository;
import com.project.waste.repository.ComplaintRepository;
import com.project.waste.repository.PointHistoryRepository;
import com.project.waste.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class CitizenService {

    private final UserRepository userRepository;
    private final PointHistoryRepository pointHistoryRepository;
    private final ComplaintRepository complaintRepository;
    private final CollectionRequestRepository collectionRequestRepository;

    public CitizenSummaryDto getSummary(String username) {
        User user = findUserByUsername(username);
        long totalRequests = collectionRequestRepository.findByCitizen_Id(
                user.getId(),
                PageRequest.of(0, 1)
        ).getTotalElements();
        long openComplaints = complaintRepository.findByCitizenId(
                user.getId(),
                PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent().stream().filter(complaint -> "OPEN".equals(complaint.getStatus())).count();

        return new CitizenSummaryDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getCity(),
                user.getTotalPoints(),
                totalRequests,
                openComplaints
        );
    }

    public Integer getTotalPoints(@NonNull Long userId) {
        return userRepository.findById(userId)
                .map(User::getTotalPoints)
                .orElse(0);
    }

    public Integer getTotalPoints(String username) {
        return findUserByUsername(username).getTotalPoints();
    }

    public List<CitizenPointHistoryDto> getPointHistory(@NonNull Long userId) {
        return pointHistoryRepository.findAllByUserId(userId)
                .stream()
                .sorted((left, right) -> right.getCreatedAt().compareTo(left.getCreatedAt()))
                .map(this::toPointHistoryDto)
                .toList();
    }

    public List<CitizenPointHistoryDto> getPointHistory(String username) {
        User user = findUserByUsername(username);
        return pointHistoryRepository.findByUserOrderByCreatedAtDesc(user, PageRequest.of(0, 50))
                .getContent()
                .stream()
                .map(this::toPointHistoryDto)
                .toList();
    }

    public List<CitizenLeaderboardEntryDto> getLeaderboard() {
        List<User> topCitizens = userRepository.findTopCitizens(PageRequest.of(0, 10));
        return IntStream.range(0, topCitizens.size())
                .mapToObj(index -> {
                    User citizen = topCitizens.get(index);
                    return new CitizenLeaderboardEntryDto(
                            index + 1,
                            citizen.getId(),
                            citizen.getFullName(),
                            citizen.getCity(),
                            citizen.getTotalPoints()
                    );
                })
                .toList();
    }

    public List<CollectionRequestDto> getCitizenRequests(@NonNull Long userId) {
        return collectionRequestRepository.findByCitizen_Id(
                        userId,
                        PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .getContent()
                .stream()
                .map(this::toCollectionRequestDto)
                .toList();
    }

    public List<CollectionRequestDto> getCitizenRequests(String username) {
        User user = findUserByUsername(username);
        return getCitizenRequests(user.getId());
    }

    public List<CitizenComplaintDto> getComplaints(String username) {
        User user = findUserByUsername(username);
        return complaintRepository.findByCitizenId(
                        user.getId(),
                        PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .getContent()
                .stream()
                .map(this::toComplaintDto)
                .toList();
    }

    public CitizenComplaintDto createComplaint(String username, CreateCitizenComplaintRequest request) {
        User user = findUserByUsername(username);
        CollectionRequest collectionRequest = collectionRequestRepository.findById(request.getRequestId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu thu gom"));

        if (!collectionRequest.getCitizen().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Bạn không thể khiếu nại cho yêu cầu của người khác");
        }

        Complaint complaint = Complaint.builder()
                .citizen(user)
                .request(collectionRequest)
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .build();

        return toComplaintDto(complaintRepository.save(Objects.requireNonNull(complaint)));
    }

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
    }

    private CitizenPointHistoryDto toPointHistoryDto(PointHistory history) {
        return new CitizenPointHistoryDto(
                history.getId(),
                history.getRequest() != null ? history.getRequest().getId() : null,
                history.getPoints(),
                history.getReason(),
                history.getCreatedAt()
        );
    }

    private CitizenComplaintDto toComplaintDto(Complaint complaint) {
        return new CitizenComplaintDto(
                complaint.getId(),
                complaint.getRequest() != null ? complaint.getRequest().getId() : null,
                complaint.getRequest() != null && complaint.getRequest().getStatus() != null
                        ? complaint.getRequest().getStatus().name()
                        : null,
                complaint.getTitle(),
                complaint.getContent(),
                complaint.getStatus(),
                complaint.getResolution(),
                complaint.getCreatedAt(),
                complaint.getResolvedAt()
        );
    }

    private CollectionRequestDto toCollectionRequestDto(CollectionRequest request) {
        return new CollectionRequestDto(
                request.getId(),
                request.getWasteType() != null ? request.getWasteType().name() : null,
                request.getDescription(),
                request.getPhotoUrl(),
                request.getEnterpriseId(),
                request.getCollectorId(),
                request.getStatus() != null ? request.getStatus().name() : null,
                request.getCreatedAt()
        );
    }
}
