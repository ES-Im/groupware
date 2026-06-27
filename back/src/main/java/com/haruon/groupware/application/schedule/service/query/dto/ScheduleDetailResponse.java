package com.haruon.groupware.application.schedule.service.query.dto;

import com.haruon.groupware.domain.schedule.ScheduleType;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record ScheduleDetailResponse(
        Long scheduleId,
        ScheduleType scheduleType,

        Long ownerId,
        String ownerDeptName,
        String ownerEmpName,
        Boolean isEditable,

        String title,
        String content,
        LocalDate scheduleDate,
        LocalTime startAt,
        LocalTime endAt,
        Boolean isAllDay,
        Boolean isCanceled,

        Integer participantCount,
        List<ParticipantResponse> participants
) {
    public ScheduleDetailResponse(
            ScheduleDetail scheduleDetail,
            List<ParticipantResponse> participants
    ) {
        this(
                scheduleDetail.scheduleId,
                scheduleDetail.scheduleType,

                scheduleDetail.ownerId, scheduleDetail.ownerDeptName,
                scheduleDetail.ownerEmpName, checkEditable(scheduleDetail),

                scheduleDetail.title, scheduleDetail.content, scheduleDetail.scheduleDate,
                scheduleDetail.startAt, scheduleDetail.endAt, scheduleDetail.isAllDay, scheduleDetail.isCanceled,

                scheduleDetail.participantCount,
                participants
        );
    }

    private static boolean checkEditable(ScheduleDetail scheduleDetail) {
        return scheduleDetail.ownerIsCurrentEmp && scheduleDetail.scheduleType.equals(ScheduleType.MANUAL);
    }

    public record ScheduleDetail(
            Long scheduleId,
            ScheduleType scheduleType,

            Long ownerId,
            String ownerDeptName,
            String ownerEmpName,
            Boolean ownerIsCurrentEmp,

            String title,
            String content,
            LocalDate scheduleDate,
            LocalTime startAt,
            LocalTime endAt,
            Boolean isAllDay,
            Boolean isCanceled,

            Integer participantCount
    ) {}

    public record ParticipantResponse(
            Long empId,
            String deptName,
            String empName
    ) {
    }
}
