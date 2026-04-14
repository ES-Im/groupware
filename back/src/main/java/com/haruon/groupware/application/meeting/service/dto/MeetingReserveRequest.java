package com.haruon.groupware.application.meeting.service.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

public record MeetingReserveRequest(
        Long meetingRoomId,
        Long reserverId,
        String title,
        LocalDate meetingDate,
        LocalTime startAt,
        LocalTime endAt,
        List<Long> participantIds
) {

    public MeetingReserveRequest {
        requireNonNull(meetingRoomId);
        requireNonNull(reserverId);
        requireNonNull(title);
        requireNonNull(meetingDate);
        requireNonNull(startAt);
        requireNonNull(endAt);
        requireNonNull(participantIds);

        state(LocalDateTime.of(meetingDate, startAt).isBefore(LocalDateTime.now(ZoneId.systemDefault())), "과거일시를 회의일로 지정할 수 없음");
        state(!endAt.isBefore(startAt), "종료시각은 시작시각보다 이를수 없음");
        state(!participantIds.isEmpty(), "회의참가자는 누락될 수 없음");
        state(!title.isBlank(), "회의 제목을 빈값이 될 수없음");
    }
}
