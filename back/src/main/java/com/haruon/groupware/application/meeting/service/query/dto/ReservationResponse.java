package com.haruon.groupware.application.meeting.service.query.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record ReservationResponse(
        Long meetingId,
        Long meetingRoomId,
        String meetingRoomName,

        Long reserverId,
        String reserverDeptName,
        String reserverEmpName,

        String title,
        LocalDate meetingDate,
        LocalTime startAt,
        LocalTime endAt,
        Boolean isCanceled,

        Integer participantCount
) {

}
