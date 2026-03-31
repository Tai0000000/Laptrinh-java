package com.project.waste.dto;

import com.project.waste.enums.WasteType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIClassificationResponse {
    private WasteType wasteType;
    private String confidence;
    private String explanation;
}
