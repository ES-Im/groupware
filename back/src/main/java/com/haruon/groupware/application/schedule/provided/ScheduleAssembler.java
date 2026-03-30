package com.haruon.groupware.application.schedule.provided;

import com.haruon.groupware.domain.draft_approval.report.BusinessTripDraft;
import com.haruon.groupware.domain.draft_approval.report.LeaveDraft;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.meetingroom.Meeting;
import com.haruon.groupware.application.schedule.provided.dto.ManualScheduleParam;
import com.haruon.groupware.domain.schedule.Schedule;
import com.haruon.groupware.application.schedule.provided.dto.ScheduleParam;
import com.haruon.groupware.domain.schedule.ScheduleType;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import static java.util.Objects.requireNonNull;

public class ScheduleAssembler {

    private ScheduleAssembler() {}

    public static List<Schedule> registerSchedules(ScheduleParam param) {
        requireNonNull(param);

        LocalTime companyStartTime = param.companyStartTime();
        LocalTime companyEndTime = param.companyEndTime();
        boolean isPublic = param.isPublic();

        if(param.leaveDraft() != null) {
            return registerLeaveSchedules(param.leaveDraft(), companyStartTime, companyEndTime, isPublic);
        } else if (param.businessTripDraft() != null) {
            return registerBusinessTripSchedules(param.businessTripDraft(), companyStartTime, companyEndTime, isPublic);
        } else if (param.meeting() != null) {
            return registerMeetingSchedules(param.meeting(), companyStartTime, companyEndTime, isPublic);
        }

        return registerManualSchedules(requireNonNull(param.manual()), companyStartTime, companyEndTime, isPublic);
    }

    private static List<Schedule> registerManualSchedules(
            ManualScheduleParam manual,
            LocalTime companyStartTime,
            LocalTime companyEndTime,
            boolean isPublic
    ) {

        LocalDate startDate = manual.startAt().toLocalDate();
        LocalDate endDate  =  manual.endAt().toLocalDate();
        LocalTime startAt =  manual.startAt().toLocalTime();
        LocalTime endAt =   manual.endAt().toLocalTime();

        String title = manual.title();

        String content = String.format(
                "날짜: %s - %s%n시각: %s - %s%n내용: %s",
                startDate, endDate,
                startAt, endAt,
                manual.content()
        );

        return registerSchedulesWithType(
                startDate, endDate,
                startAt, endAt,
                ScheduleType.MANUAL,
                title, content,
                manual.owner(),
                companyStartTime, companyEndTime,
                isPublic, null);
    }

    private static List<Schedule> registerMeetingSchedules(
            Meeting meeting,
            LocalTime companyStartTime,
            LocalTime companyEndTime,
            boolean isPublic
    ) {

        String title = meeting.getTitle();
        String content = String.format(
                "날짜: %s%n시각: %s - %s%n장소: %s%n회의건: %s",
                meeting.getMeetingDate(),
                meeting.getStartAt(),
                meeting.getEndAt(),
                meeting.getMeetingRoom(),
                meeting.getTitle()
        );

        return registerSchedulesWithType(
                meeting.getMeetingDate(), meeting.getMeetingDate(),
                meeting.getStartAt(), meeting.getEndAt(),
                ScheduleType.MEETING,
                title, content,
                meeting.getEmp(),
                companyStartTime, companyEndTime,
                isPublic,
                meeting.getId());
    }

    private static List<Schedule> registerBusinessTripSchedules(
            BusinessTripDraft businessTripDraft,
            LocalTime companyStartTime,
            LocalTime companyEndTime,
            boolean isPublic
    ) {

        LocalDate startDate = businessTripDraft.getStartAt().toLocalDate();
        LocalDate endDate  =  businessTripDraft.getEndAt().toLocalDate();
        LocalTime startAt =  businessTripDraft.getStartAt().toLocalTime();
        LocalTime endAt =   businessTripDraft.getEndAt().toLocalTime();

        String title = businessTripDraft.getTitle();
        String content = String.format(
                "시작일시: %s%n종료일시: %s%n출장지: %s%n출장목적: %s",
                businessTripDraft.getStartAt(),
                businessTripDraft.getEndAt(),
                businessTripDraft.getDestination(),
                businessTripDraft.getPurpose()
        );

        return registerSchedulesWithType(
                startDate, endDate,
                startAt, endAt,
                ScheduleType.BUSINESS_TRIP,
                title, content,
                businessTripDraft.getEmp(),
                companyStartTime, companyEndTime,
                isPublic,
                businessTripDraft.getId());
    }

    private static List<Schedule> registerLeaveSchedules(
            LeaveDraft leaveDraft,
            LocalTime companyStartTime,
            LocalTime companyEndTime,
            boolean isPublic
    ) {

        LocalDate startDate = leaveDraft.getStartAt().toLocalDate();
        LocalDate endDate  =  leaveDraft.getEndAt().toLocalDate();
        LocalTime startAt =  leaveDraft.getStartAt().toLocalTime();
        LocalTime endAt =   leaveDraft.getEndAt().toLocalTime();
        String reason = (leaveDraft.getContent() != null)? leaveDraft.getContent() : leaveDraft.getLeaveType().getDescription();

        String title = leaveDraft.getLeaveType().getDescription();
        String content = String.format(
                "연가 종류: %s%n시작일시: %s%n종료일시: %s%n사유: %s",
                leaveDraft.getLeaveType().getDescription(),
                leaveDraft.getStartAt(),
                leaveDraft.getEndAt(),
                reason
        );

        return registerSchedulesWithType(
                startDate, endDate,
                startAt, endAt,
                ScheduleType.LEAVE,
                title, content,
                leaveDraft.getEmp(),
                companyStartTime, companyEndTime,
                isPublic,
                leaveDraft.getId());
    }

    private static List<Schedule> registerSchedulesWithType(
            LocalDate startDate, LocalDate endDate,
            LocalTime startAt, LocalTime endAt,
            ScheduleType type,
            String title, String content,
            Emp scheduleOwner,
            LocalTime companyStartAt, LocalTime companyEndAt,
            boolean isPublic,
            @Nullable Long sourceId
    ) {
        List<Schedule> schedules = new ArrayList<>();

        long days = ChronoUnit.DAYS.between(startDate, endDate);

        for (int i = 0; i <= days; i++) {
            LocalDate targetDate = startDate.plusDays(i);

            TimeRange timeRange = getTimesPerDay(
                    startDate, endDate, targetDate,
                    startAt, endAt,
                    companyStartAt, companyEndAt
            );

            Schedule schedule = Schedule.registerSchedule(
                    sourceId,
                    type,
                    scheduleOwner,
                    title, content,
                    targetDate,
                    timeRange.startAt(), timeRange.endAt(),
                    timeRange.isAllDay(),
                    isPublic
            );

            schedule.addParticipant(scheduleOwner);
            schedules.add(schedule);
        }

        return schedules;
    }

    private static TimeRange getTimesPerDay(
            LocalDate startDate,
            LocalDate endDate,
            LocalDate targetDate,
            LocalTime startAt,
            LocalTime endAt,
            LocalTime companyStartAt,
            LocalTime companyEndAt
    ) {
        if (startDate.equals(endDate)) {
            return new TimeRange(
                    startAt,
                    endAt,
                    startAt.equals(companyStartAt) && endAt.equals(companyEndAt)
            );
        }

        if (targetDate.equals(startDate)) {
            return new TimeRange(
                    startAt,
                    companyEndAt,
                    startAt.equals(companyStartAt)
            );
        }

        if (targetDate.equals(endDate)) {
            return new TimeRange(
                    companyStartAt,
                    endAt,
                    endAt.equals(companyEndAt)
            );
        }

        return new TimeRange(companyStartAt, companyEndAt, true);
    }

    private record TimeRange(
            LocalTime startAt,
            LocalTime endAt,
            boolean isAllDay
    ) {
    }
}
