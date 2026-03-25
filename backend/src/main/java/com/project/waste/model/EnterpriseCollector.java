package com.project.waste.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "enterprise_collectors")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EnterpriseCollector {

    @EmbeddedId
    private EnterpriseCollectorId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("enterpriseId")
    @JoinColumn(name = "enterprise_id")
    private Enterprise enterprise;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("collectorId")
    @JoinColumn(name = "collector_id")
    private User collector;

    @Column(name = "joined_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime joinedAt = LocalDateTime.now();

    @Embeddable
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    @EqualsAndHashCode
    public static class EnterpriseCollectorId implements java.io.Serializable {
        @Column(name = "enterprise_id")
        private Long enterpriseId;
        @Column(name = "collector_id")
        private Long collectorId;
    }
}
