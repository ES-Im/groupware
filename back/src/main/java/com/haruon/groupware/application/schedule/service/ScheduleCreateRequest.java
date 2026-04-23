package com.haruon.groupware.application.schedule.service;

import lombok.Builder;
import org.jspecify.annotations.Nullable;

import static java.util.Objects.requireNonNull;

// 일정 공통 파라미터
@Builder
public record ScheduleCreateRequest(

        @Nullable
        String sourceKey,

        @Nullable
        ManualScheduleParam manualScheduleParam,

        Boolean isPublic

) {

    public ScheduleCreateRequest {
        requireNonNull(isPublic, "공식 여부는 필수 값");
        if(sourceKey == null) requireNonNull(manualScheduleParam);
        if(manualScheduleParam == null) requireNonNull(sourceKey);
    }
}
