package com.project.waste.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.project.waste.enums.WasteType;

@Entity
@Table(name = "point_rules")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PointRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enterprise_id", nullable = false)
    private Enterprise enterprise;

    @Enumerated(EnumType.STRING)
    @Column(name = "waste_type", nullable = false, columnDefinition = "waste_type")
    private WasteType wasteType;

    @Column(name = "base_points", nullable = false)
    @Builder.Default
    private int basePoints = 10;

    @Column(name = "bonus_points", nullable = false)
    @Builder.Default
    private int bonusPoints = 0;

    @Column(name = "bonus_condition")
    private String bonusCondition;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

