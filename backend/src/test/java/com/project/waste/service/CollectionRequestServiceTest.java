package com.project.waste.service;

import com.project.waste.enums.CollectionStatus;
import com.project.waste.enums.WasteType;
import com.project.waste.model.*;
import com.project.waste.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CollectionRequestServiceTest {

    @Mock
    private CollectionRequestRepository collectionRequestRepository;
    @Mock
    private CollectorRepository collectorRepository;
    @Mock
    private RequestStatusHistoryRepository requestStatusHistoryRepository;
    @Mock
    private EnterpriseRepository enterpriseRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    private CollectionRequestService collectionRequestService;

    private User citizen;
    private User owner;
    private Enterprise enterprise;
    private CollectionRequest request;
    private Collector collector;
    private User collectorUser;

    @BeforeEach
    void setUp() {
        collectionRequestService = new CollectionRequestService(
                collectionRequestRepository,
                collectorRepository,
                requestStatusHistoryRepository,
                enterpriseRepository,
                userRepository,
                eventPublisher,
                null // self is not used in doAcceptRequest/other methods we test directly
        );

        citizen = User.builder().id(1L).fullName("Citizen").build();
        owner = User.builder().id(2L).fullName("Owner").build();
        enterprise = Enterprise.builder().id(1L).owner(owner).build();
        
        request = CollectionRequest.builder()
                .id(1L)
                .citizen(citizen)
                .enterprise(enterprise)
                .status(CollectionStatus.PENDING)
                .wasteType(WasteType.RECYCLABLE)
                .build();

        collectorUser = User.builder().id(3L).fullName("Collector User").build();
        collector = new Collector(1L, 1L, 3L);
    }

    // 1. Test Accept Success
    @Test
    void acceptRequest_Success() {
        when(collectionRequestRepository.findById(1L)).thenReturn(Optional.of(request));
        when(enterpriseRepository.findById(1L)).thenReturn(Optional.of(enterprise));
        when(collectionRequestRepository.save(any())).thenReturn(request);

        CollectionRequest result = collectionRequestService.doAcceptRequest(1L, 1L);

        assertEquals(CollectionStatus.ACCEPTED, result.getStatus());
        verify(requestStatusHistoryRepository, times(1)).save(any());
    }

    // 2. Test Accept Fail - Wrong Enterprise
    @Test
    void acceptRequest_WrongEnterprise_ThrowsException() {
        when(collectionRequestRepository.findById(1L)).thenReturn(Optional.of(request));

        assertThrows(IllegalArgumentException.class, () -> {
            collectionRequestService.doAcceptRequest(1L, 2L);
        });
    }

    // 3. Test Reject Success
    @Test
    void rejectRequest_Success() {
        when(collectionRequestRepository.findById(1L)).thenReturn(Optional.of(request));
        when(enterpriseRepository.findById(1L)).thenReturn(Optional.of(enterprise));
        when(collectionRequestRepository.save(any())).thenReturn(request);

        CollectionRequest result = collectionRequestService.rejectRequest(1L, 1L);

        assertEquals(CollectionStatus.REJECTED, result.getStatus());
        verify(requestStatusHistoryRepository, times(1)).save(any());
    }

    // 4. Test Reject Fail - Wrong Enterprise
    @Test
    void rejectRequest_WrongEnterprise_ThrowsException() {
        when(collectionRequestRepository.findById(1L)).thenReturn(Optional.of(request));

        assertThrows(IllegalArgumentException.class, () -> {
            collectionRequestService.rejectRequest(1L, 2L);
        });
    }

    // 5. Test Assign Success
    @Test
    void assignCollector_Success() {
        request.setStatus(CollectionStatus.ACCEPTED);
        when(collectorRepository.existsByIdAndEnterpriseId(1L, 1L)).thenReturn(true);
        when(collectionRequestRepository.findById(1L)).thenReturn(Optional.of(request));
        when(collectorRepository.findById(1L)).thenReturn(Optional.of(collector));
        when(enterpriseRepository.findById(1L)).thenReturn(Optional.of(enterprise));
        when(collectionRequestRepository.save(any())).thenReturn(request);

        CollectionRequest result = collectionRequestService.assignCollector(1L, 1L, 1L);

        assertEquals(CollectionStatus.ASSIGNED, result.getStatus());
        assertEquals(collector, result.getAssignedCollector());
    }

    // 6. Test Assign Fail - Collector not in Enterprise
    @Test
    void assignCollector_WrongCollector_ThrowsException() {
        when(collectorRepository.existsByIdAndEnterpriseId(2L, 1L)).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> {
            collectionRequestService.assignCollector(1L, 1L, 2L);
        });
    }

    // 7. Test Start Collection Success
    @Test
    void startCollection_Success() {
        request.setStatus(CollectionStatus.ASSIGNED);
        request.setAssignedCollector(collector);
        
        when(collectionRequestRepository.findById(1L)).thenReturn(Optional.of(request));
        when(collectorRepository.findById(1L)).thenReturn(Optional.of(collector));
        when(userRepository.findById(3L)).thenReturn(Optional.of(collectorUser));
        when(collectionRequestRepository.save(any())).thenReturn(request);

        CollectionRequest result = collectionRequestService.startCollection(1L);

        assertEquals(CollectionStatus.ON_THE_WAY, result.getStatus());
    }

    // 8. Test Complete Collection Success
    @Test
    void completeCollection_Success() {
        request.setStatus(CollectionStatus.ON_THE_WAY);
        request.setAssignedCollector(collector);

        when(collectionRequestRepository.findById(1L)).thenReturn(Optional.of(request));
        when(collectorRepository.findById(1L)).thenReturn(Optional.of(collector));
        when(userRepository.findById(3L)).thenReturn(Optional.of(collectorUser));
        when(collectionRequestRepository.save(any())).thenReturn(request);

        CollectionRequest result = collectionRequestService.completeCollection(1L);

        assertEquals(CollectionStatus.COLLECTED, result.getStatus());
        verify(eventPublisher, times(1)).publishEvent(any());
    }

    // 9. Test State Machine - Invalid Transition (PENDING -> ON_THE_WAY)
    @Test
    void transition_Invalid_ThrowsException() {
        when(collectionRequestRepository.findById(1L)).thenReturn(Optional.of(request));

        assertThrows(IllegalStateException.class, () -> {
            collectionRequestService.startCollection(1L);
        });
    }

    // 10. Test State Machine - Terminal State (COLLECTED -> CANCELLED)
    @Test
    void transition_FromTerminal_ThrowsException() {
        request.setStatus(CollectionStatus.COLLECTED);
        
        assertThrows(IllegalStateException.class, () -> {
            request.transitionTo(CollectionStatus.CANCELLED);
        });
    }

    // 11. Test Create Request Success
    @Test
    void createRequest_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(citizen));
        when(enterpriseRepository.findById(1L)).thenReturn(Optional.of(enterprise));
        when(collectionRequestRepository.save(any())).thenReturn(request);

        CollectionRequest result = collectionRequestService.createRequest(1L, 1L, "RECYCLABLE", "desc", "url", 0.0, 0.0);

        assertNotNull(result);
        verify(requestStatusHistoryRepository, times(1)).save(any());
    }

    // 12. Test Accept Fail - Request Not Found
    @Test
    void acceptRequest_NotFound_ThrowsException() {
        when(collectionRequestRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            collectionRequestService.doAcceptRequest(99L, 1L);
        });
    }

    // 13. Test Assign Fail - Wrong Enterprise for Request
    @Test
    void assignCollector_WrongEnterpriseForRequest_ThrowsException() {
        when(collectorRepository.existsByIdAndEnterpriseId(1L, 2L)).thenReturn(true);
        when(collectionRequestRepository.findById(1L)).thenReturn(Optional.of(request));

        assertThrows(IllegalArgumentException.class, () -> {
            collectionRequestService.assignCollector(1L, 2L, 1L);
        });
    }
}
