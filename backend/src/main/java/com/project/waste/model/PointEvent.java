package com.project.waste.model;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PointEvent {
    private final Long userId;
    private final Integer points;
    private final String reason;
}
