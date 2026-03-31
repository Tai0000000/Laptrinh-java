package com.project.waste.event;

import com.project.waste.enums.WasteType;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class RequestCollectedEvent extends ApplicationEvent {

    private final Long requestId;
    private final Long citizenId;
    private final Long enterpriseId;
    private final WasteType wasteType;

    public RequestCollectedEvent(Object source, Long requestId,
                                  Long citizenId, Long enterpriseId,
                                  WasteType wasteType) {
        super(source);
        this.requestId = requestId;
        this.citizenId = citizenId;
        this.enterpriseId = enterpriseId;
        this.wasteType = wasteType;
    }
}
