package com.project.waste.model;

import jakarta.persistence.*;

@Entity
@Table(name = "collectors")
public class Collector {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "enterprise_id", nullable = false)
    private Long enterpriseId;

    @Column(name = "user_id")
    private Long userId;

    public Collector() {
    }

    public Collector(Long id, Long enterpriseId, Long userId) {
        this.id = id;
        this.enterpriseId = enterpriseId;
        this.userId = userId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEnterpriseId() { return enterpriseId; }
    public void setEnterpriseId(Long enterpriseId) { this.enterpriseId = enterpriseId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}