package com.haruon.groupware.application.schedule.service.command.request;

import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record ManualScheduleCreateRequest(

        @NotBlank
        @Size(max = 100)
        String title,

        @NotBlank
        String content,

        @NotNull
        LocalDateTime startAt,

        @NotNull
        LocalDateTime endAt

) {
    public ManualScheduleCreateRequest {
        if(startAt == null || endAt == null || title == null || content == null) throw new RequiredValueMissingException();

        if(endAt.isBefore(startAt)) throw new EndTimeBeforeStartTimeException();
    }
}
