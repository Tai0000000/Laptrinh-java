package com.project.waste.service;

import com.project.waste.event.CollectionCompletedEvent;
import com.project.waste.model.Collector;
import com.project.waste.model.Enterprise;
import com.project.waste.model.CollectionRequest;
import com.project.waste.model.RequestStatusHistory;
import com.project.waste.model.User;
import com.project.waste.repository.CollectionRequestRepository;
import com.project.waste.repository.EnterpriseRepository;
import com.project.waste.repository.CollectorRepository;
import com.project.waste.repository.RequestStatusHistoryRepository;
import com.project.waste.repository.UserRepository;
import com.project.waste.enums.WasteType;
import com.project.waste.enums.CollectionStatus;
import jakarta.persistence.OptimisticLockException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Lazy;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CollectionRequestService {

    private static final int OPTIMISTIC_LOCK_MAX_RETRIES = 3;

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
    public CollectionRequest createRequest(Long citizenId, Long enterpriseId, String wasteType,
                                          String description, String imageUrl, Double latitude, Double longitude) {
        CollectionRequest request = new CollectionRequest();
        User citizen = userRepository.findById(citizenId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy citizen id: " + citizenId));
        Enterprise enterprise = enterpriseRepository.findById(enterpriseId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy enterprise id: " + enterpriseId));

        request.setCitizen(citizen);
        request.setEnterprise(enterprise);
        request.setWasteType(WasteType.valueOf(wasteType.toUpperCase()));
        request.setDescription(description);
        request.setPhotoUrl(imageUrl); // In model it's photoUrl, not imageUrl
        request.setLatitude(latitude);
        request.setLongitude(longitude);
        CollectionRequest saved = collectionRequestRepository.save(request);

        User changedBy = citizen;
        RequestStatusHistory history = RequestStatusHistory.builder()
                .request(saved)
                .fromStatus(null)
                .toStatus(CollectionStatus.PENDING)
                .changedBy(changedBy)
                .note("Initial request created")
                .build();
        requestStatusHistoryRepository.save(history);

        return saved;
    }

    public CollectionRequest acceptRequest(Long requestId, Long enterpriseId) {
        int attempt = 0;
        while (true) {
            try {
                return self.doAcceptRequest(requestId, enterpriseId);
            } catch (OptimisticLockException | ObjectOptimisticLockingFailureException e) {
                attempt++;
                if (attempt >= OPTIMISTIC_LOCK_MAX_RETRIES) {
                    throw new IllegalStateException("Yêu cầu đang được xử lý bởi người khác. Vui lòng thử lại sau.", e);
                }
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public CollectionRequest doAcceptRequest(Long requestId, Long enterpriseId) {
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
        requestStatusHistoryRepository.save(history);

        return saved;
    }

    @Transactional
    public CollectionRequest rejectRequest(Long requestId, Long enterpriseId) {
        CollectionRequest request = collectionRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu id: " + requestId));

        if (!enterpriseId.equals(request.getEnterpriseId())) {
            throw new IllegalArgumentException("Enterprise không có quyền từ chối yêu cầu này");
        }

        CollectionStatus fromStatus = request.getStatus();
        request.transitionTo(CollectionStatus.REJECTED);
        CollectionRequest saved = collectionRequestRepository.save(request);

        Enterprise enterprise = enterpriseRepository.findById(enterpriseId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy enterprise id: " + enterpriseId));
        User changedBy = enterprise.getOwner();
        RequestStatusHistory history = RequestStatusHistory.builder()
                .request(saved)
                .fromStatus(fromStatus)
                .toStatus(CollectionStatus.REJECTED)
                .changedBy(changedBy)
                .note("Enterprise rejected request")
                .build();
        requestStatusHistoryRepository.save(history);

        return saved;
    }

    @Transactional
    public CollectionRequest assignCollector(Long requestId, Long enterpriseId, Long collectorId) {
        if (!collectorRepository.existsByIdAndEnterpriseId(collectorId, enterpriseId)) {
            throw new IllegalArgumentException("Collector " + collectorId + " không thuộc enterprise " + enterpriseId);
        }

        CollectionRequest request = collectionRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu id: " + requestId));

        if (!enterpriseId.equals(request.getEnterpriseId())) {
            throw new IllegalArgumentException("Enterprise không có quyền phân công yêu cầu này");
        }

        CollectionStatus fromStatus = request.getStatus();
        request.transitionTo(CollectionStatus.ASSIGNED);
        var collector = collectorRepository.findById(collectorId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy collector id: " + collectorId));
        request.setAssignedCollector(collector);
        CollectionRequest saved = collectionRequestRepository.save(request);

        Enterprise enterprise = enterpriseRepository.findById(enterpriseId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy enterprise id: " + enterpriseId));
        User changedBy = enterprise.getOwner();
        RequestStatusHistory history = RequestStatusHistory.builder()
                .request(saved)
                .fromStatus(fromStatus)
                .toStatus(CollectionStatus.ASSIGNED)
                .changedBy(changedBy)
                .note("Enterprise assigned collector")
                .build();
        requestStatusHistoryRepository.save(history);

        return saved;
    }

    @Transactional
    public CollectionRequest startCollection(Long requestId) {
        CollectionRequest request = collectionRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu id: " + requestId));

        CollectionStatus fromStatus = request.getStatus();
        request.transitionTo(CollectionStatus.ON_THE_WAY);
        CollectionRequest saved = collectionRequestRepository.save(request);

        Long collectorId = request.getCollectorId();
        Collector collector = collectorRepository.findById(collectorId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy collector id: " + collectorId));
        User changedBy = userRepository.findById(collector.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy userId của collector: " + collector.getUserId()));

        RequestStatusHistory history = RequestStatusHistory.builder()
                .request(saved)
                .fromStatus(fromStatus)
                .toStatus(CollectionStatus.ON_THE_WAY)
                .changedBy(changedBy)
                .note("Collector started collection")
                .build();
        requestStatusHistoryRepository.save(history);

        return saved;
    }

    @Transactional
    public CollectionRequest completeCollection(Long requestId) {
        CollectionRequest request = collectionRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu id: " + requestId));

        CollectionStatus fromStatus = request.getStatus();
        request.transitionTo(CollectionStatus.COLLECTED);
        CollectionRequest saved = collectionRequestRepository.save(request);

        Long collectorId = request.getCollectorId();
        Collector collector = collectorRepository.findById(collectorId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy collector id: " + collectorId));
        User changedBy = userRepository.findById(collector.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy userId của collector: " + collector.getUserId()));

        RequestStatusHistory history = RequestStatusHistory.builder()
                .request(saved)
                .fromStatus(fromStatus)
                .toStatus(CollectionStatus.COLLECTED)
                .changedBy(changedBy)
                .note("Collector completed collection")
                .build();
        requestStatusHistoryRepository.save(history);

        eventPublisher.publishEvent(new CollectionCompletedEvent(this, saved));
        return saved;
    }
}