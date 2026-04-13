package com.project.waste.event;

import com.project.waste.model.PointEvent;
import com.project.waste.model.User;
import com.project.waste.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Objects;

@Component("simplePointEventHandler")
public class PointEventHandler {

    @Autowired
    private UserRepository userRepository;

    
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handlePointAddition(@NonNull PointEvent event) {

        
        User user = userRepository.findById(Objects.requireNonNull(event.getUserId()))
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user để cộng điểm!"));

        
        int currentPoints = user.getTotalPoints(); 
        int newTotal = currentPoints + event.getPoints();

        user.setTotalPoints(newTotal);

        userRepository.save(user);

        System.out.println("Đã cộng " + event.getPoints() + " điểm cho user " + user.getId() + " thành công!");
    }
}