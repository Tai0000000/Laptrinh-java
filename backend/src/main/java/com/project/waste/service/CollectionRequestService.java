package com.project.waste.service;

import com.project.waste.event.CollectionCompletedEvent;
import com.project.waste.model.CollectionRequest;
import com.project.waste.model.CollectionStatus;
import com.project.waste.repository.CollectionRequestRepository;
import com.project.waste.repository.CollectorRepository;
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
    private final ApplicationEventPublisher eventPublisher;
    private final CollectionRequestService self;

    public CollectionRequestService(CollectionRequestRepository collectionRequestRepository,
                                   CollectorRepository collectorRepository,
                                   ApplicationEventPublisher eventPublisher,
                                   @Lazy CollectionRequestService self) {
        this.collectionRequestRepository = collectionRequestRepository;
        this.collectorRepository = collectorRepository;
        this.eventPublisher = eventPublisher;
        this.self = self;
    }

    @Transactional
    public CollectionRequest createRequest(Long citizenId, Long enterpriseId, String wasteType,
                                          String description, String imageUrl, Double latitude, Double longitude) {
        CollectionRequest request = new CollectionRequest();
        request.setCitizenId(citizenId);
        request.setEnterpriseId(enterpriseId);
        request.setWasteType(wasteType);
        request.setDescription(description);
        request.setImageUrl(imageUrl);
        request.setLatitude(latitude);
        request.setLongitude(longitude);
        return collectionRequestRepository.save(request);
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

        request.transitionTo(CollectionStatus.ACCEPTED);
        return collectionRequestRepository.save(request);
    }

    @Transactional
    public CollectionRequest rejectRequest(Long requestId, Long enterpriseId) {
        CollectionRequest request = collectionRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu id: " + requestId));

        if (!enterpriseId.equals(request.getEnterpriseId())) {
            throw new IllegalArgumentException("Enterprise không có quyền từ chối yêu cầu này");
        }

        request.transitionTo(CollectionStatus.REJECTED);
        return collectionRequestRepository.save(request);
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

        request.transitionTo(CollectionStatus.ASSIGNED);
        request.setCollectorId(collectorId);
        return collectionRequestRepository.save(request);
    }

    @Transactional
    public CollectionRequest startCollection(Long requestId) {
        CollectionRequest request = collectionRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu id: " + requestId));

        request.transitionTo(CollectionStatus.ON_THE_WAY);
        return collectionRequestRepository.save(request);
    }

    @Transactional
    public CollectionRequest completeCollection(Long requestId) {
        CollectionRequest request = collectionRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu id: " + requestId));

        request.transitionTo(CollectionStatus.COLLECTED);
        CollectionRequest saved = collectionRequestRepository.save(request);

        eventPublisher.publishEvent(new CollectionCompletedEvent(this, saved));
        return saved;
    }
}