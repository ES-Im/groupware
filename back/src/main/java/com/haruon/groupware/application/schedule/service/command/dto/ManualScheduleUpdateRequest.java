package com.haruon.groupware.application.schedule.service.command.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalTime;

@Builder
public record ManualScheduleUpdateRequest(

        @Nullable
        @Size(max = 100)
        String title,

        @Nullable
        String content,

        @Nullable
        LocalTime startAt,

        @Nullable
        LocalTime endAt

) {
    public ManualScheduleUpdateRequest {
        if(startAt == null && endAt == null && title == null && content == null)
            throw new RequiredValueMissingException();

        if(title != null) if(title.isBlank()) throw new BlankValueNotAllowedException();
        if(content != null) if(content.isBlank()) throw new BlankValueNotAllowedException();

        if ( (endAt != null && startAt != null)
                && endAt.isBefore(startAt) ) throw new EndTimeBeforeStartTimeException();
    }
}
