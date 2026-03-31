package com.project.waste.controller;

import com.project.waste.dto.AIClassificationResponse;
import com.project.waste.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AIController {

    @Autowired
    private AIService aiService;

    @PostMapping("/classify")
    public AIClassificationResponse classifyWaste(
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String imageUrl) {
        
        return aiService.classifyWaste(description, imageUrl);
    }
}
