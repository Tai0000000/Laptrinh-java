package com.project.waste.service;

import com.project.waste.event.CollectionCompletedEvent;
import com.project.waste.model.Collector;
import com.project.waste.model.Enterprise;
import com.project.waste.model.CollectionRequest;
import com.project.waste.model.PointHistory;
import com.project.waste.model.RequestStatusHistory;
import com.project.waste.model.User;
import com.project.waste.dto.CreateCollectionRequest;
import com.project.waste.repository.CollectionRequestRepository;
import com.project.waste.repository.EnterpriseRepository;
import com.project.waste.repository.CollectorRepository;
import com.project.waste.repository.PointHistoryRepository;
import com.project.waste.repository.RequestStatusHistoryRepository;
import com.project.waste.repository.UserRepository;
import com.project.waste.enums.CollectionStatus;
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
    private static final int CITIZEN_REPORT_BONUS_POINTS = 1;

    private final CollectionRequestRepository collectionRequestRepository;
    private final CollectorRepository collectorRepository;
    private final RequestStatusHistoryRepository requestStatusHistoryRepository;
    private final EnterpriseRepository enterpriseRepository;
    private final UserRepository userRepository;
    private final PointHistoryRepository pointHistoryRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final CollectionRequestService self;

    public CollectionRequestService(CollectionRequestRepository collectionRequestRepository,
                                   CollectorRepository collectorRepository,
                                   RequestStatusHistoryRepository requestStatusHistoryRepository,
                                   EnterpriseRepository enterpriseRepository,
                                   UserRepository userRepository,
                                   PointHistoryRepository pointHistoryRepository,
                                   ApplicationEventPublisher eventPublisher,
                                   @Lazy CollectionRequestService self) {
        this.collectionRequestRepository = collectionRequestRepository;
        this.collectorRepository = collectorRepository;
        this.requestStatusHistoryRepository = requestStatusHistoryRepository;
        this.enterpriseRepository = enterpriseRepository;
        this.userRepository = userRepository;
        this.pointHistoryRepository = pointHistoryRepository;
        this.eventPublisher = eventPublisher;
        this.self = self;
    }

    @Transactional
    public CollectionRequest createRequest(String username, CreateCollectionRequest dto) {
        User citizen = findUserByPrincipal(username);
        
        CollectionRequest request = CollectionRequest.builder()
                .citizen(citizen)
                .enterprise(null) 
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

        pointHistoryRepository.save(Objects.requireNonNull(PointHistory.builder()
                .user(citizen)
                .request(saved)
                .points(CITIZEN_REPORT_BONUS_POINTS)
                .reason("Thưởng: gửi báo cáo thu gom")
                .build()));

        userRepository.addPoints(citizen.getId(), CITIZEN_REPORT_BONUS_POINTS);

        return saved;
    }

    public Page<CollectionRequest> getMyCitizenRequests(String username, int page) {
        User user = findUserByPrincipal(username);
        return collectionRequestRepository.findByCitizen_Id(user.getId(), PageRequest.of(page, PAGE_SIZE, Sort.by("createdAt").descending()));
    }

    public List<CollectionRequest> getPendingRequests() {
        return collectionRequestRepository.findByEnterpriseIsNullAndStatusOrderByCreatedAtAsc(CollectionStatus.PENDING);
    }

    public List<CollectionRequest> getAcceptedRequests(String username) {
        User user = findUserByPrincipal(username);
        Enterprise ent = enterpriseRepository.findByOwnerId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Enterprise not found for user"));
        return collectionRequestRepository.findByEnterprise_IdAndStatusOrderByCreatedAtAsc(ent.getId(), CollectionStatus.ACCEPTED);
    }

    public CollectionRequest acceptRequest(@NonNull Long requestId, String username) {
        User user = findUserByPrincipal(username);
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

        
        if (request.getEnterpriseId() != null && !enterpriseId.equals(request.getEnterpriseId())) {
            throw new IllegalArgumentException("Enterprise không có quyền chấp nhận yêu cầu này");
        }

        Enterprise enterprise = enterpriseRepository.findById(enterpriseId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy enterprise id: " + enterpriseId));

        CollectionStatus fromStatus = request.getStatus();
        request.setEnterprise(enterprise);
        request.transitionTo(CollectionStatus.ACCEPTED);
        CollectionRequest saved = collectionRequestRepository.save(request);

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
        User user = findUserByPrincipal(username);
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
    public CollectionRequest assignCollector(@NonNull Long requestId, @NonNull Long collectorUserId, String username) {
        User user = findUserByPrincipal(username);
        Enterprise ent = enterpriseRepository.findByOwnerId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Enterprise not found for user"));

        User collectorUser = userRepository.findById(collectorUserId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user collector id: " + collectorUserId));
        if (collectorUser.getRole() != com.project.waste.enums.UserRole.COLLECTOR) {
            throw new IllegalArgumentException("User " + collectorUserId + " không phải vai trò COLLECTOR");
        }

        if (!userRepository.existsById(collectorUserId)) {
            throw new IllegalArgumentException("Collector không tồn tại");
        }

        
        if (!enterpriseRepository.existsById(ent.getId())) {
            throw new IllegalArgumentException("Enterprise không tồn tại");
        }

        
        Collector collector = collectorRepository.findByUserIdAndEnterpriseId(collectorUserId, ent.getId())
                .orElseGet(() -> collectorRepository.save(new Collector(null, ent.getId(), collectorUserId)));

        
        if (!ent.getId().equals(collector.getEnterpriseId())) {
            throw new IllegalArgumentException("Collector " + collectorUserId + " không thuộc enterprise hiện tại");
        }

        CollectionRequest request = collectionRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu id: " + requestId));

        if (!ent.getId().equals(request.getEnterpriseId())) {
            throw new IllegalArgumentException("Enterprise không có quyền phân công yêu cầu này");
        }

        CollectionStatus fromStatus = request.getStatus();
        request.transitionTo(CollectionStatus.ASSIGNED);
        request.setAssignedCollector(collector);
        CollectionRequest saved = collectionRequestRepository.save(request);

        RequestStatusHistory history = RequestStatusHistory.builder()
                .request(saved)
                .fromStatus(fromStatus)
                .toStatus(CollectionStatus.ASSIGNED)
                .changedBy(user)
                .note("Enterprise assigned collector: " + collectorUserId)
                .build();
        requestStatusHistoryRepository.save(Objects.requireNonNull(history));

        return saved;
    }

    public Page<CollectionRequest> getMyCollectorTasks(String username, int page) {
        User user = findUserByPrincipal(username);
        return collectionRequestRepository.findByAssignedCollectorUserId(
                user.getId(), PageRequest.of(page, PAGE_SIZE, Sort.by("createdAt").descending()));
    }

    public List<CollectionRequest> getActiveCollectorTasks(String username) {
        User user = findUserByPrincipal(username);
        List<CollectionRequest> mine = collectionRequestRepository.findActiveTasksByCollectorUserId(user.getId());
        if (!mine.isEmpty()) {
            return mine;
        }
        
        
        return collectorRepository.findByUserId(user.getId())
                .map(collector -> collectionRequestRepository.findActiveTasksByEnterpriseId(collector.getEnterpriseId()))
                .orElse(java.util.Collections.emptyList());
    }

    public Page<CollectionRequest> getCollectorHistory(String username, int page) {
        User user = findUserByPrincipal(username);
        return collectionRequestRepository.findHistoryByCollectorUserId(
                user.getId(), PageRequest.of(page, PAGE_SIZE, Sort.by("updatedAt").descending()));
    }

    @Transactional
    public CollectionRequest startCollection(@NonNull Long requestId, String username) {
        User user = findUserByPrincipal(username);
        Collector collector = collectorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User is not a collector"));

        CollectionRequest request = collectionRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu id: " + requestId));

        if (request.getAssignedCollector() == null) {
            throw new IllegalArgumentException("Yêu cầu chưa được phân công collector");
        }

        Long assignedUserId = request.getAssignedCollector().getUserId();
        if (assignedUserId == null) {
            throw new IllegalArgumentException("Collector được gán không hợp lệ");
        }

        
        if (!assignedUserId.equals(user.getId())) {
            boolean sameEnterprise = request.getAssignedCollector().getEnterpriseId() != null
                    && request.getAssignedCollector().getEnterpriseId().equals(collector.getEnterpriseId());
            if (request.getStatus() == CollectionStatus.ASSIGNED && sameEnterprise) {
                request.setAssignedCollector(collector);
            } else {
                throw new IllegalArgumentException("Yêu cầu không được gán cho collector này");
            }
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
        User user = findUserByPrincipal(username);

        CollectionRequest request = collectionRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu id: " + requestId));

        if (request.getAssignedCollector() == null
                || request.getAssignedCollector().getUserId() == null
                || !request.getAssignedCollector().getUserId().equals(user.getId())) {
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

    private User findUserByPrincipal(String principal) {
        return userRepository.findByUsername(principal)
                .or(() -> userRepository.findByEmail(principal))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user: " + principal));
    }
}
