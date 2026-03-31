package com.project.waste.dto;
import com.project.waste.enums.WasteType;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CreateCollectionRequest {

    @NotNull(message = "Loại rác không được trống")
    private WasteType wasteType;

    private String description;

    @NotNull(message = "Vĩ độ không được trống")
    @DecimalMin(value = "-90.0") @DecimalMax(value = "90.0")
    private BigDecimal latitude;

    @NotNull(message = "Kinh độ không được trống")
    @DecimalMin(value = "-180.0") @DecimalMax(value = "180.0")
    private BigDecimal longitude;

    private String addressText;
    private String photoUrl;
}
