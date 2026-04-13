package com.project.waste.service;

import com.project.waste.dto.CreateCollectionRequest;
import com.project.waste.enums.UserRole;
import com.project.waste.enums.WasteType;
import com.project.waste.model.CollectionRequest;
import com.project.waste.model.PointHistory;
import com.project.waste.model.User;
import com.project.waste.repository.CollectionRequestRepository;
import com.project.waste.repository.CollectorRepository;
import com.project.waste.repository.EnterpriseRepository;
import com.project.waste.repository.PointHistoryRepository;
import com.project.waste.repository.RequestStatusHistoryRepository;
import com.project.waste.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CollectionRequestServicePointBonusTest {

    @Test
    void createRequest_addsBonusPointsAndPointHistory() {
        CollectionRequestRepository requestRepo = mock(CollectionRequestRepository.class);
        CollectorRepository collectorRepo = mock(CollectorRepository.class);
        RequestStatusHistoryRepository historyRepo = mock(RequestStatusHistoryRepository.class);
        EnterpriseRepository enterpriseRepo = mock(EnterpriseRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        PointHistoryRepository pointHistoryRepo = mock(PointHistoryRepository.class);
        ApplicationEventPublisher eventPublisher = mock(ApplicationEventPublisher.class);

        CollectionRequestService service = new CollectionRequestService(
                requestRepo,
                collectorRepo,
                historyRepo,
                enterpriseRepo,
                userRepo,
                pointHistoryRepo,
                eventPublisher,
                null
        );

        User citizen = User.builder()
                .id(1L)
                .username("citizen")
                .email("citizen@example.com")
                .passwordHash("hash")
                .fullName("Citizen")
                .role(UserRole.CITIZEN)
                .build();

        when(userRepo.findByUsername("citizen")).thenReturn(Optional.of(citizen));
        when(requestRepo.save(any(CollectionRequest.class))).thenAnswer(invocation -> {
            CollectionRequest toSave = invocation.getArgument(0);
            toSave.setId(100L);
            return toSave;
        });

        CreateCollectionRequest dto = new CreateCollectionRequest();
        dto.setWasteType(WasteType.ORGANIC);
        dto.setLatitude(BigDecimal.valueOf(10.0));
        dto.setLongitude(BigDecimal.valueOf(106.0));
        dto.setAddressText("123 Nguyen Hue");
        dto.setDescription("Test");
        dto.setPhotoUrl("");

        CollectionRequest created = service.createRequest("citizen", dto);

        assertNotNull(created);
        assertEquals(100L, created.getId());

        verify(userRepo).addPoints(1L, 1);

        ArgumentCaptor<PointHistory> captor = ArgumentCaptor.forClass(PointHistory.class);
        verify(pointHistoryRepo).save(captor.capture());
        PointHistory savedHistory = captor.getValue();
        assertEquals(1, savedHistory.getPoints());
        assertEquals("Thưởng: gửi báo cáo thu gom", savedHistory.getReason());
        assertEquals(1L, savedHistory.getUser().getId());
        assertEquals(100L, savedHistory.getRequest().getId());
    }
}

