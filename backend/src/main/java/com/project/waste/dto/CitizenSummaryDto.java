package com.project.waste.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CitizenSummaryDto {
    private Long id;
    private String fullName;
    private String email;
    private String city;
    private Integer totalPoints;
    private Long totalRequests;
    private Long openComplaints;
}
