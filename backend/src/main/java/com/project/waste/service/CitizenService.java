package com.project.waste.service; //Task 10: Hoang Kha

import com.project.waste.model.Complaint;
import com.project.waste.model.ComplaintStatus;
import com.project.waste.model.PointHistory;
import com.project.waste.model.User;
import com.project.waste.repository.ComplaintRepository;
import com.project.waste.repository.PointHistoryRepository;
import com.project.waste.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CitizenService {
    @Autowired // Giup di tim class tuong ung
    private UserRepository userRepository;

    @Autowired
    private PointHistoryRepository pointHistoryRepository;

    @Autowired
    private ComplaintRepository complaintRepository;
    // check userId in Database
    public Integer getTotalPoints(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);// Optional : check box- FindBy: Check data in DB (Spring boot cung cap)
        if (userOpt.isPresent()) {  //isPresent: Check box - If data in box = True -> get() user
            User user = userOpt.get();
            return user.getTotalPoints();
            }
        return 0;
    }
    // Tra ve list pointHistory (use findALLByUserId)
    public List<PointHistory> getPointHistory(Long userId) {
        return pointHistoryRepository.findAllByUserId(userId);
    }
    // Tra ve list Leaderboard
    public List<User> getLeaderboard() {
        return userRepository.findAllByOrderByTotalPointsDesc();
    }
    // Create Complaint
    public Complaint createComplaint(Long userId, String title, String content) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        //use orElseThroe check data in DB. Neu k co tra ve ham Throw
        Complaint complaint = Complaint.builder()
                .user(user)
                .title(title)
                .content(content)
                .build();

        return complaintRepository.save(complaint);
    }

}
