package com.haruon.groupware.application.schedule.service;

import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.util.UUID;

import static java.util.Objects.requireNonNull;

// 일정 공통 파라미터
@Builder
public record ScheduleCreateRequest(

        @Nullable
        String sourceKey,

        @Nullable
        ManualScheduleParam manualScheduleParam
) {

    public ScheduleCreateRequest {
        if(sourceKey == null) requireNonNull(manualScheduleParam);
        if(manualScheduleParam == null) requireNonNull(sourceKey);

        if(manualScheduleParam != null) {
            sourceKey = UUID.randomUUID().toString();
        }
    }
}
