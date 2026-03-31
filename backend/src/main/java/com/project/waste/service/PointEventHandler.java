package com.project.waste.service;


import com.project.waste.model.*;
import com.project.waste.repository.*;
import com.project.waste.event.RequestCollectedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class PointEventHandler {

    private final PointRuleRepository pointRuleRepo;
    private final PointTransactionRepository pointTxRepo;
    private final UserRepository userRepo;
    private final CollectionRequestRepository requestRepo;


    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onRequestCollected(RequestCollectedEvent event) {
        log.info("Processing points for request={}, citizen={}",
                event.getRequestId(), event.getCitizenId());

        pointRuleRepo.findByEnterpriseIdAndWasteTypeAndActiveTrue(
                event.getEnterpriseId(), event.getWasteType()
        ).ifPresentOrElse(
            rule -> creditPoints(event, rule),
            () -> creditDefaultPoints(event)
        );
    }

    private void creditPoints(RequestCollectedEvent event, PointRule rule) {
        int totalPoints = rule.getBasePoints() + rule.getBonusPoints();
        saveTransaction(event, rule, totalPoints,
                "Collected " + event.getWasteType() + " (rule: " + rule.getId() + ")");
    }

    private void creditDefaultPoints(RequestCollectedEvent event) {
        // Default 5 điểm nếu enterprise chưa cấu hình rule
        saveTransaction(event, null, 5, "Collected " + event.getWasteType() + " (default)");
    }

    private void saveTransaction(RequestCollectedEvent event, PointRule rule,
                                  int points, String reason) {
        CollectionRequest request = requestRepo.getReferenceById(event.getRequestId());
        User citizen = userRepo.getReferenceById(event.getCitizenId());

        PointTransaction tx = PointTransaction.builder()
                .citizen(citizen)
                .request(request)
                .rule(rule)
                .points(points)
                .reason(reason)
                .build();
        pointTxRepo.save(tx);

        // Cộng điểm atomic (UPDATE users SET total_points = total_points + ?)
        userRepo.addPoints(event.getCitizenId(), points);

        log.info("Credited {} points to citizen {}. Reason: {}", points, event.getCitizenId(), reason);
    }
}
