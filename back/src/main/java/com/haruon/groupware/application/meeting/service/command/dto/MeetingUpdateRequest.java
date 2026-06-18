package com.haruon.groupware.application.meeting.service.command.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.time.LocalTime;

@Builder
public record MeetingUpdateRequest(

        @Nullable LocalDate meetingDate,
        @Nullable LocalTime startAt,
        @Nullable LocalTime endAt,
        @Nullable Long meetingRoomId,
        @Nullable @Size(max = 100) String title

) {
    public MeetingUpdateRequest {
        if(meetingDate == null && startAt == null && endAt == null && meetingRoomId == null && title == null) throw new RequiredValueMissingException();

        if(endAt != null && startAt != null) if(!endAt.isAfter(startAt)) throw new EndTimeBeforeStartTimeException();

        if(title != null) if(title.isBlank()) throw new BlankValueNotAllowedException();

    }
}
