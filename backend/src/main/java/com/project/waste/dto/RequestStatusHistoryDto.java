package com.project.waste.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RequestStatusHistoryDto {
    private String fromStatus;
    private String toStatus;
    private LocalDateTime changedAt;
    private Long changedById;
    private String changedByName;
}