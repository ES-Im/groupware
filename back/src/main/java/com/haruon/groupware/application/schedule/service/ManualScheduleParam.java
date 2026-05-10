package com.haruon.groupware.application.schedule.service;

import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record ManualScheduleParam(

        Long ownerId,

        String title,

        String content,

        LocalDateTime startAt,

        LocalDateTime endAt

) {
    public ManualScheduleParam {
        if(startAt == null || endAt == null || ownerId == null || title == null || content == null) throw new RequiredValueMissingException();

        if(endAt.isBefore(startAt)) throw new EndTimeBeforeStartTimeException();
    }
}
