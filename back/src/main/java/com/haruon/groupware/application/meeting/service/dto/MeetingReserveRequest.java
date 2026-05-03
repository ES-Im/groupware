package com.haruon.groupware.application.meeting.service.dto;

import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Set;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

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
        requireNonNull(meetingRoomId);
        requireNonNull(reserverId);
        requireNonNull(title);
        requireNonNull(meetingDate);
        requireNonNull(startAt);
        requireNonNull(endAt);
        requireNonNull(participantIds);

        state(LocalDateTime.of(meetingDate, startAt).isAfter(LocalDateTime.now(ZoneId.systemDefault())), "과거일시를 회의일로 지정할 수 없음");
        state(endAt.isAfter(startAt), "종료시각은 시작시각보다 늦어야 함");
        state(!participantIds.isEmpty(), "회의참가자는 누락될 수 없음");
        state(!title.isBlank(), "회의 제목을 빈값이 될 수없음");
    }
}
