package com.haruon.groupware.application.schedule.provided;

import com.haruon.groupware.application.CompanyPolicyPort;
import com.haruon.groupware.application.schedule.provided.dto.ManualScheduleParam;
import com.haruon.groupware.application.schedule.provided.dto.ScheduleParam;
import com.haruon.groupware.domain.draft_approval.report.BusinessTripDraft;
import com.haruon.groupware.domain.draft_approval.report.LeaveDraft;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.meetingroom.Meeting;
import com.haruon.groupware.domain.schedule.Schedule;
import com.haruon.groupware.domain.schedule.ScheduleType;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import static java.util.Objects.requireNonNull;

public class ScheduleAssembler {

    private final LocalTime COMPANY_START_AT;
    private final LocalTime COMPANY_END_AT;

    public ScheduleAssembler(CompanyPolicyPort port) {
        this.COMPANY_START_AT = port.getStartTime();
        this.COMPANY_END_AT = port.getEndTime();
    }

    public List<Schedule> registerSchedules(ScheduleParam param) {
        requireNonNull(param);

        boolean isPublic = param.isPublic();

        if(param.leaveDraft() != null) {
            return registerLeaveSchedules(param.leaveDraft(), isPublic);
        } else if (param.businessTripDraft() != null) {
            return registerBusinessTripSchedules(param.businessTripDraft(), isPublic);
        } else if (param.meeting() != null) {
            return registerMeetingSchedules(param.meeting(), isPublic);
        }

        return registerManualSchedules(requireNonNull(param.manual()), isPublic);
    }

    private List<Schedule> registerManualSchedules(
            ManualScheduleParam manual,
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
                isPublic, null);
    }

    private List<Schedule> registerMeetingSchedules(
            Meeting meeting,
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
                isPublic,
                meeting.getId());
    }

    private List<Schedule> registerBusinessTripSchedules(
            BusinessTripDraft businessTripDraft,
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
                isPublic,
                businessTripDraft.getId());
    }

    private List<Schedule> registerLeaveSchedules(
            LeaveDraft leaveDraft,
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
                isPublic,
                leaveDraft.getId());
    }

    private List<Schedule> registerSchedulesWithType(
            LocalDate startDate, LocalDate endDate,
            LocalTime startAt, LocalTime endAt,
            ScheduleType type,
            String title, String content,
            Emp scheduleOwner,
            boolean isPublic,
            @Nullable Long sourceId
    ) {
        List<Schedule> schedules = new ArrayList<>();

        long days = ChronoUnit.DAYS.between(startDate, endDate);

        for (int i = 0; i <= days; i++) {
            LocalDate targetDate = startDate.plusDays(i);

            TimeRange timeRange = getTimesPerDay(
                    startDate, endDate, targetDate,
                    startAt, endAt
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

    private TimeRange getTimesPerDay(
            LocalDate startDate,
            LocalDate endDate,
            LocalDate targetDate,
            LocalTime startAt,
            LocalTime endAt
    ) {
        if (startDate.equals(endDate)) {
            return new TimeRange(
                    startAt,
                    endAt,
                    startAt.equals(COMPANY_START_AT) && endAt.equals(COMPANY_END_AT)
            );
        }

        if (targetDate.equals(startDate)) {
            return new TimeRange(
                    startAt,
                    COMPANY_END_AT,
                    startAt.equals(COMPANY_START_AT)
            );
        }

        if (targetDate.equals(endDate)) {
            return new TimeRange(
                    COMPANY_START_AT,
                    endAt,
                    endAt.equals(COMPANY_END_AT)
            );
        }

        return new TimeRange(COMPANY_START_AT, COMPANY_END_AT, true);
    }

    private record TimeRange(
            LocalTime startAt,
            LocalTime endAt,
            boolean isAllDay
    ) {
    }
}
