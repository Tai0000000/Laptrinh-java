package com.project.waste.service;

import com.project.waste.event.CollectionCompletedEvent;
import com.project.waste.model.Collector;
import com.project.waste.model.Enterprise;
import com.project.waste.model.CollectionRequest;
import com.project.waste.model.RequestStatusHistory;
import com.project.waste.model.User;
import com.project.waste.dto.CreateCollectionRequest;
import com.project.waste.repository.CollectionRequestRepository;
import com.project.waste.repository.EnterpriseRepository;
import com.project.waste.repository.CollectorRepository;
import com.project.waste.repository.RequestStatusHistoryRepository;
import com.project.waste.repository.UserRepository;
import com.project.waste.enums.CollectionStatus;
import com.project.waste.enums.WasteType;
import jakarta.persistence.OptimisticLockException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.lang.NonNull;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
public class CollectionRequestService {

    private static final int OPTIMISTIC_LOCK_MAX_RETRIES = 3;
    private static final int PAGE_SIZE = 10;

    private final CollectionRequestRepository collectionRequestRepository;
    private final CollectorRepository collectorRepository;
    private final RequestStatusHistoryRepository requestStatusHistoryRepository;
    private final EnterpriseRepository enterpriseRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final CollectionRequestService self;

    public CollectionRequestService(CollectionRequestRepository collectionRequestRepository,
                                   CollectorRepository collectorRepository,
                                   RequestStatusHistoryRepository requestStatusHistoryRepository,
                                   EnterpriseRepository enterpriseRepository,
                                   UserRepository userRepository,
                                   ApplicationEventPublisher eventPublisher,
                                   @Lazy CollectionRequestService self) {
        this.collectionRequestRepository = collectionRequestRepository;
        this.collectorRepository = collectorRepository;
        this.requestStatusHistoryRepository = requestStatusHistoryRepository;
        this.enterpriseRepository = enterpriseRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
        this.self = self;
    }

    @Transactional
    public CollectionRequest createRequest(String username, CreateCollectionRequest dto) {
        User citizen = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user: " + username));
        
        // Find an enterprise to assign to (for simplicity, just pick first or handle differently)
        // Note: In a real app, this might be based on service area
        Enterprise enterprise = enterpriseRepository.findAll().stream()
                .filter(Enterprise::isVerified)
                .findFirst()
                .orElse(null); // Allow enterprise to be null initially if no verified enterprise exists

        CollectionRequest request = CollectionRequest.builder()
                .citizen(citizen)
                .enterprise(enterprise)
                .wasteType(dto.getWasteType())
                .description(dto.getDescription())
                .photoUrl(dto.getPhotoUrl())
                .latitude(dto.getLatitude() != null ? dto.getLatitude().doubleValue() : 0.0)
                .longitude(dto.getLongitude() != null ? dto.getLongitude().doubleValue() : 0.0)
                .addressText(dto.getAddressText())
                .status(CollectionStatus.PENDING)
                .build();
                
        CollectionRequest saved = collectionRequestRepository.save(Objects.requireNonNull(request));

        RequestStatusHistory history = RequestStatusHistory.builder()
                .request(saved)
                .fromStatus(null)
                .toStatus(CollectionStatus.PENDING)
                .changedBy(citizen)
                .note("Initial request created via API")
                .build();
        requestStatusHistoryRepository.save(Objects.requireNonNull(history));

        return saved;
    }

    public Page<CollectionRequest> getMyCitizenRequests(String username, int page) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return collectionRequestRepository.findByCitizen_Id(user.getId(), PageRequest.of(page, PAGE_SIZE, Sort.by("createdAt").descending()));
    }

    public List<CollectionRequest> getPendingRequests() {
        return collectionRequestRepository.findByStatusOrderByCreatedAtAsc(CollectionStatus.PENDING);
    }

    public List<CollectionRequest> getAcceptedRequests(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Enterprise ent = enterpriseRepository.findByOwnerId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Enterprise not found for user"));
        return collectionRequestRepository.findByEnterprise_IdAndStatusOrderByCreatedAtAsc(ent.getId(), CollectionStatus.ACCEPTED);
    }

    public CollectionRequest acceptRequest(@NonNull Long requestId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Enterprise ent = enterpriseRepository.findByOwnerId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Enterprise not found for user"));
        
        int attempt = 0;
        while (true) {
            try {
                return self.doAcceptRequest(requestId, ent.getId());
            } catch (OptimisticLockException | ObjectOptimisticLockingFailureException e) {
                attempt++;
                if (attempt >= OPTIMISTIC_LOCK_MAX_RETRIES) {
                    throw new IllegalStateException("Yêu cầu đang được xử lý bởi người khác. Vui lòng thử lại sau.", e);
                }
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public CollectionRequest doAcceptRequest(@NonNull Long requestId, @NonNull Long enterpriseId) {
        CollectionRequest request = collectionRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu id: " + requestId));

        if (!enterpriseId.equals(request.getEnterpriseId())) {
            throw new IllegalArgumentException("Enterprise không có quyền chấp nhận yêu cầu này");
        }

        CollectionStatus fromStatus = request.getStatus();
        request.transitionTo(CollectionStatus.ACCEPTED);
        CollectionRequest saved = collectionRequestRepository.save(request);

        Enterprise enterprise = enterpriseRepository.findById(enterpriseId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy enterprise id: " + enterpriseId));
        User changedBy = enterprise.getOwner();
        RequestStatusHistory history = RequestStatusHistory.builder()
                .request(saved)
                .fromStatus(fromStatus)
                .toStatus(CollectionStatus.ACCEPTED)
                .changedBy(changedBy)
                .note("Enterprise accepted request")
                .build();
        requestStatusHistoryRepository.save(Objects.requireNonNull(history));

        return saved;
    }

    @Transactional
    public CollectionRequest rejectRequest(@NonNull Long requestId, String username, String reason) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Enterprise ent = enterpriseRepository.findByOwnerId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Enterprise not found for user"));

        CollectionRequest request = collectionRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu id: " + requestId));

        if (!ent.getId().equals(request.getEnterpriseId())) {
            throw new IllegalArgumentException("Enterprise không có quyền từ chối yêu cầu này");
        }

        CollectionStatus fromStatus = request.getStatus();
        request.transitionTo(CollectionStatus.REJECTED);
        request.setRejectReason(reason);
        CollectionRequest saved = collectionRequestRepository.save(request);

        RequestStatusHistory history = RequestStatusHistory.builder()
                .request(saved)
                .fromStatus(fromStatus)
                .toStatus(CollectionStatus.REJECTED)
                .changedBy(user)
                .note("Enterprise rejected request: " + reason)
                .build();
        requestStatusHistoryRepository.save(Objects.requireNonNull(history));

        return saved;
    }

    @Transactional
    public CollectionRequest assignCollector(@NonNull Long requestId, @NonNull Long collectorId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Enterprise ent = enterpriseRepository.findByOwnerId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Enterprise not found for user"));

        if (!collectorRepository.existsByIdAndEnterpriseId(collectorId, ent.getId())) {
            throw new IllegalArgumentException("Collector " + collectorId + " không thuộc enterprise " + ent.getId());
        }

        CollectionRequest request = collectionRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu id: " + requestId));

        if (!ent.getId().equals(request.getEnterpriseId())) {
            throw new IllegalArgumentException("Enterprise không có quyền phân công yêu cầu này");
        }

        CollectionStatus fromStatus = request.getStatus();
        request.transitionTo(CollectionStatus.ASSIGNED);
        var collector = collectorRepository.findById(collectorId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy collector id: " + collectorId));
        request.setAssignedCollector(collector);
        CollectionRequest saved = collectionRequestRepository.save(request);

        RequestStatusHistory history = RequestStatusHistory.builder()
                .request(saved)
                .fromStatus(fromStatus)
                .toStatus(CollectionStatus.ASSIGNED)
                .changedBy(user)
                .note("Enterprise assigned collector")
                .build();
        requestStatusHistoryRepository.save(Objects.requireNonNull(history));

        return saved;
    }

    public Page<CollectionRequest> getMyCollectorTasks(String username, int page) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Collector collector = collectorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User is not a collector"));
        return collectionRequestRepository.findByAssignedCollector_Id(collector.getId(), PageRequest.of(page, PAGE_SIZE, Sort.by("createdAt").descending()));
    }

    public List<CollectionRequest> getActiveCollectorTasks(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Collector collector = collectorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User is not a collector"));
        return collectionRequestRepository.findActiveTasksByCollector(collector.getId());
    }

    public Page<CollectionRequest> getCollectorHistory(String username, int page) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Collector collector = collectorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User is not a collector"));
        return collectionRequestRepository.findHistoryByCollector(collector.getId(), PageRequest.of(page, PAGE_SIZE, Sort.by("updatedAt").descending()));
    }

    @Transactional
    public CollectionRequest startCollection(@NonNull Long requestId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Collector collector = collectorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User is not a collector"));

        CollectionRequest request = collectionRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu id: " + requestId));

        if (request.getCollectorId() == null || !request.getCollectorId().equals(collector.getId())) {
            throw new IllegalArgumentException("Yêu cầu không được gán cho collector này");
        }

        CollectionStatus fromStatus = request.getStatus();
        request.transitionTo(CollectionStatus.ON_THE_WAY);
        CollectionRequest saved = collectionRequestRepository.save(request);

        RequestStatusHistory history = RequestStatusHistory.builder()
                .request(saved)
                .fromStatus(fromStatus)
                .toStatus(CollectionStatus.ON_THE_WAY)
                .changedBy(user)
                .note("Collector started collection")
                .build();
        requestStatusHistoryRepository.save(Objects.requireNonNull(history));

        return saved;
    }

    @Transactional
    public CollectionRequest completeCollection(@NonNull Long requestId, String username, String proofImageUrl) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Collector collector = collectorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User is not a collector"));

        CollectionRequest request = collectionRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu id: " + requestId));

        if (request.getCollectorId() == null || !request.getCollectorId().equals(collector.getId())) {
            throw new IllegalArgumentException("Yêu cầu không được gán cho collector này");
        }

        CollectionStatus fromStatus = request.getStatus();
        request.transitionTo(CollectionStatus.COLLECTED);
        request.setProofImageUrl(proofImageUrl);
        CollectionRequest saved = collectionRequestRepository.save(request);

        RequestStatusHistory history = RequestStatusHistory.builder()
                .request(saved)
                .fromStatus(fromStatus)
                .toStatus(CollectionStatus.COLLECTED)
                .changedBy(user)
                .note("Collector completed collection")
                .build();
        requestStatusHistoryRepository.save(Objects.requireNonNull(history));

        eventPublisher.publishEvent(new CollectionCompletedEvent(this, saved));
        return saved;
    }
}
