package com.haruon.groupware.application.schedule.service;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.util.UUID;


// 일정 공통 파라미터
@Builder
public record ScheduleCreateRequest(

        String sourceKey,

        @Nullable
        ManualScheduleParam manualScheduleParam
) {

    public static ScheduleCreateRequest fromSource(String sourceKey) {
        if(sourceKey == null) throw new RequiredValueMissingException();

        return new ScheduleCreateRequest(sourceKey, null);
    }

    public static ScheduleCreateRequest fromManual(ManualScheduleParam param) {
        if(param == null) throw new RequiredValueMissingException();

        return new ScheduleCreateRequest(UUID.randomUUID().toString(),param);
    }
}
