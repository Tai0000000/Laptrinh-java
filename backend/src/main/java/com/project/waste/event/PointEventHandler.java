package com.project.waste.event;

import com.project.waste.model.PointEvent;
import com.project.waste.model.User;
import com.project.waste.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component("simplePointEventHandler")// Thanh phan he thong
public class PointEventHandler {

    @Autowired
    private UserRepository userRepository;

    // Event PointEven: Chi khi DB commit giao dich moi cong diem
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handlePointAddition(PointEvent event) {

        // Tim kiem nguoi dung
        User user = userRepository.findById(event.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user để cộng điểm!"));

        //Ham kiem tra gia tri diem trong data
        int currentPoints = user.getTotalPoints(); 
        int newTotal = currentPoints + event.getPoints();

        user.setTotalPoints(newTotal);

        userRepository.save(user);

        System.out.println("Đã cộng " + event.getPoints() + " điểm cho user " + user.getId() + " thành công!");
    }
}