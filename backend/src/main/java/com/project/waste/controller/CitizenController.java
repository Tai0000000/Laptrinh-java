package com.project.waste.controller;

import com.project.waste.model.Complaint;
import com.project.waste.model.PointHistory;
import com.project.waste.model.User;
import com.project.waste.service.CitizenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/citizen") // moi link (URL) phai theo dinh dang "/api/citizen"
public class CitizenController {

    @Autowired
    private CitizenService citizenService;
    // Link cho tinh nang xem tong diem
    @GetMapping("/points/{userId}") // Get = lay data dua vao Id
    public Integer getTotalPoints(@PathVariable Long userId) { // Path gan gia tri vao bien
        return citizenService.getTotalPoints(userId);
    }
    // Link xem lich su diem
    @GetMapping("/history/{userId}")
    public List<PointHistory> getPointHistory(@PathVariable Long userId) {
        return citizenService.getPointHistory(userId);
    }
    // link xem BXH
    @GetMapping("/leaderboard")
    public List<User> getLeaderboard() {
        return citizenService.getLeaderboard();
    }
    //link tao phieu Complaint
    @PostMapping("/complaint")
    public Complaint createComplaint(
            @RequestParam Long userId, // @RequestParam : lay data trong phan than request
            @RequestParam String title,
            @RequestParam String content) {

        return citizenService.createComplaint(userId, title, content);
    }
}
