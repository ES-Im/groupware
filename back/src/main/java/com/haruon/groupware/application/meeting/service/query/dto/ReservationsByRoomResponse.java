package com.haruon.groupware.application.meeting.service.query.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record ReservationsByRoomResponse(
        String reserverDeptName,
        String reserverEmpName,
        Integer participantCount,
        LocalDate meetingDate,
        LocalTime startAt,
        LocalTime endAt
) {
}
