package com.project.waste.enums;

public enum CollectionStatus {
    PENDING,
    ACCEPTED,
    REJECTED,
    ASSIGNED,
    ON_THE_WAY,
    COLLECTED,
    CANCELLED;

    


    public boolean canTransitionTo(CollectionStatus next) {
        if (next == null || this == next) {
            return false;
        }
        return switch (this) {
            case PENDING -> next == ACCEPTED || next == REJECTED || next == CANCELLED;
            case ACCEPTED -> next == ASSIGNED || next == CANCELLED;
            case ASSIGNED -> next == ON_THE_WAY || next == CANCELLED;
            case ON_THE_WAY -> next == COLLECTED || next == CANCELLED;
            case REJECTED, COLLECTED, CANCELLED -> false;
        };
    }
}
