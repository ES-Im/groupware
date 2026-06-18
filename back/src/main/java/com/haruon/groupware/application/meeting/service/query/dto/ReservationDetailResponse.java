package com.haruon.groupware.application.meeting.service.query.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record ReservationDetailResponse(
        Long meetingId,
        Long meetingRoomId,
        String meetingRoomName,
        Long reserverId,
        String reserverDeptName,
        String reserverEmpName,
        String title,
        Integer participantCount,
        LocalDate meetingDate,
        LocalTime startAt,
        LocalTime endAt,
        Boolean isCanceled,
        List<ParticipantResponse> participants
) {

    public static ReservationDetailResponse of(
            ReservationInfo reservationInfo,
            List<ParticipantResponse> participants
    ) {
        return new ReservationDetailResponse(
                reservationInfo.meetingId,
                reservationInfo.meetingRoomId,
                reservationInfo.meetingRoomName,
                reservationInfo.reserverId,
                reservationInfo.reserverDeptName,
                reservationInfo.reserverEmpName,
                reservationInfo.title,
                reservationInfo.participantCount,
                reservationInfo.meetingDate,
                reservationInfo.startAt,
                reservationInfo.endAt,
                reservationInfo.isCanceled,
                participants
        );
    }

    public record ReservationInfo(
            Long meetingId,
            Long meetingRoomId,
            String meetingRoomName,
            Long reserverId,
            String reserverDeptName,
            String reserverEmpName,
            String title,
            Integer participantCount,
            LocalDate meetingDate,
            LocalTime startAt,
            LocalTime endAt,
            Boolean isCanceled
    ) {
    }

    public record ParticipantResponse(
            Long empId,
            String deptName,
            String empName
    ) {
    }
}
