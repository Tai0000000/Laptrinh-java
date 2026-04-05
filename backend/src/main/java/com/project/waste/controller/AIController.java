package com.project.waste.controller;

import com.project.waste.dto.AIClassificationRequest;
import com.project.waste.dto.AIClassificationResponse;
import com.project.waste.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    @Autowired
    private AIService aiService;

    @PostMapping("/classify")
    public AIClassificationResponse classifyWaste(@RequestBody(required = false) AIClassificationRequest request) {
        return aiService.classifyWaste(
                request != null ? request.getDescription() : null,
                request != null ? request.getImageData() : null
        );
    }
}
