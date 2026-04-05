package com.project.waste.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateCitizenComplaintRequest {
    @NotNull
    private Long requestId;

    @NotBlank
    private String title;

    @NotBlank
    private String content;
}
