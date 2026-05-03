package com.haruon.groupware.application.meeting.service.dto;

import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.time.LocalTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

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
        requireNonNull(meetingId);
        requireNonNull(reserverId);

        boolean isEdited = meetingDate != null || startAt != null || endAt != null
                || meetingRoomId != null || title != null;

        state(isEdited, "변경내용이 없음");

        if(endAt != null && startAt != null){
            state(endAt.isAfter(startAt), "종료시간은 시작시간보다 늦어야 함");
        }

        if(title != null) {
            state(!title.isBlank(), "회의 title에 빈값이 올 수 없음");
        }
    }
}
