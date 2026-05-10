package com.haruon.groupware.application.meeting.service.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.common.PastTimeNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Set;

@Builder
public record MeetingReserveRequest(
        Long meetingRoomId,
        Long reserverId,
        String title,
        LocalDate meetingDate,
        LocalTime startAt,
        LocalTime endAt,
        Set<Long> participantIds
) {

    public MeetingReserveRequest {
        if(meetingRoomId == null || reserverId == null || title == null || meetingDate == null || startAt == null || endAt == null || participantIds == null) {
            throw new RequiredValueMissingException();
        }

        if(LocalDateTime.of(meetingDate, startAt).isBefore(LocalDateTime.now(ZoneId.systemDefault()))) throw new PastTimeNotAllowedException();
        if(endAt.isBefore(startAt)) throw new EndTimeBeforeStartTimeException();
        if(participantIds.isEmpty()) throw new RequiredValueMissingException();
        if(title.isBlank()) throw new BlankValueNotAllowedException();
    }
}
