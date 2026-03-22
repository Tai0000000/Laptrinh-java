package com.project.waste.event;

import com.project.waste.model.CollectionRequest;
import org.springframework.context.ApplicationEvent;

public class CollectionCompletedEvent extends ApplicationEvent {

    private final CollectionRequest collectionRequest;

    public CollectionCompletedEvent(Object source, CollectionRequest collectionRequest) {
        super(source);
        this.collectionRequest = collectionRequest;
    }

    public CollectionRequest getCollectionRequest() {
        return collectionRequest;
    }
}