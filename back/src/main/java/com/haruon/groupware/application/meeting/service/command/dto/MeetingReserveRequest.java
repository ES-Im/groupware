package com.haruon.groupware.application.meeting.service.command.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.common.PastTimeNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.meeting.MeetingParticipantRequiredException;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Set;

import static com.haruon.groupware.application.utils.Utils.SEOUL_ZONE;

@Builder
public record MeetingReserveRequest(

        Long meetingRoomId,

        Long reserverId,

        @NotBlank
        @Size(max = 100)
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

        if(LocalDateTime.of(meetingDate, startAt).isBefore(LocalDateTime.now(SEOUL_ZONE))) throw new PastTimeNotAllowedException();
        if(!endAt.isAfter(startAt)) throw new EndTimeBeforeStartTimeException();
        if(participantIds.isEmpty()) throw new MeetingParticipantRequiredException();
        if(title.isBlank()) throw new BlankValueNotAllowedException();
    }
}
