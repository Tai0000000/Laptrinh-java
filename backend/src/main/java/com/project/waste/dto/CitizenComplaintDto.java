package com.project.waste.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CitizenComplaintDto {
    private Long id;
    private Long requestId;
    private String requestStatus;
    private String title;
    private String content;
    private String status;
    private String resolution;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}
