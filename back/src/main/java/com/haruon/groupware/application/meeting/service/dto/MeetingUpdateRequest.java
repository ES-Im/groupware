package com.haruon.groupware.application.meeting.service.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.time.LocalTime;

@Builder
public record MeetingUpdateRequest(

        Long meetingId,
        Long reserverId,

        @Nullable LocalDate meetingDate,
        @Nullable LocalTime startAt,
        @Nullable LocalTime endAt,
        @Nullable Long meetingRoomId,
        @Nullable String title

) {
    public MeetingUpdateRequest {
        if(meetingId == null || reserverId == null) throw new RequiredValueMissingException();

        if(meetingDate == null && startAt == null && endAt == null && meetingRoomId == null && title == null) throw new RequiredValueMissingException();

        if(endAt != null && startAt != null) if(endAt.isBefore(startAt)) throw new EndTimeBeforeStartTimeException();

        if(title != null) if(title.isBlank()) throw new BlankValueNotAllowedException();

    }
}
