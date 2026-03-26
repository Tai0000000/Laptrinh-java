package com.project.waste.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CollectionRequestDto {
    private Long id;
    private String wasteType;
    private String description;
    private String photoUrl;
    private Long enterpriseId;
    private Long collectorId;
    private String status;
    private LocalDateTime createdAt;
}