package com.project.waste.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CitizenPointHistoryDto {
    private Long id;
    private Long requestId;
    private int points;
    private String reason;
    private LocalDateTime createdAt;
}
