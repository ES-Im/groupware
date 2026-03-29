package com.haruon.groupware.domain.schedule;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.draft_approval.report.BusinessTripDraft;
import com.haruon.groupware.domain.draft_approval.report.LeaveDraft;
import com.haruon.groupware.domain.empInfo.emp.Emp;
import com.haruon.groupware.domain.meetingroom.Meeting;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import static com.haruon.groupware.domain.schedule.ScheduleParticipant.registerScheduleParticipant;
import static java.util.Objects.requireNonNull;

@Entity
@Getter(AccessLevel.PROTECTED)
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"schedule_type", "source_id"})
)
public class Schedule extends AbstractEntity {

    private long sourceId;

    @Enumerated(EnumType.STRING)
    private ScheduleType scheduleType;

    @ManyToOne
    @JoinColumn(name = "owner_emp_id",  nullable = false)
    private Emp emp;

    private String title;

    private String content;

    LocalDate scheduleDate;

    LocalTime startAt;

    LocalTime endAt;

    private boolean isAllDay;

    private boolean isCanceled;

    private boolean isForDivision;

    @OneToMany(mappedBy = "schedule", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScheduleParticipant> scheduleParticipants = new ArrayList<>();

    public static List<Schedule> registerSchedules(ScheduleParam param) {

        LocalTime companyStartTime = param.companyStartTime();
        LocalTime companyEndTime = param.companyEndTime();

        if(param.leaveDraft() != null) {
            return registerLeaveSchedules(param.leaveDraft(), companyStartTime, companyEndTime);
        } else if (param.businessTripDraft() != null) {
            return registerBusinessTripSchedules(param.businessTripDraft(), companyStartTime, companyEndTime);
        } else if (param.meeting() != null) {
            return registerMeetingSchedules(param.meeting(), companyStartTime, companyEndTime);
        } else if (param.manual() != null) {
            return registerManualSchedules(param.manual(), companyStartTime, companyEndTime);
        }
        
        throw new IllegalArgumentException("잘못된 일정 타입");
    }

    private static List<Schedule> registerManualSchedules(ManualScheduleParam manual, LocalTime companyStartTime, LocalTime companyEndTime) {
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

        return registerSchedulesWithType(startDate, endDate,
                startAt, endAt, ScheduleType.MANUAL,
                title, content,
                manual.owner(),
                companyStartTime, companyEndTime);
    }

    private static List<Schedule> registerMeetingSchedules(Meeting meeting, LocalTime companyStartTime, LocalTime companyEndTime) {

        String title = meeting.getTitle();
        String content = String.format(
                "날짜: %s%n시각: %s - %s%n장소: %s%n회의건: %s",
                meeting.getMeetingDate(),
                meeting.getStartAt(),
                meeting.getEndAt(),
                meeting.getMeetingRoom(),
                meeting.getTitle()
        );

        return registerSchedulesWithType(meeting.getMeetingDate(), meeting.getMeetingDate(),
                meeting.getStartAt(), meeting.getEndAt(), ScheduleType.MEETING,
                title, content,
                meeting.getEmp(),
                companyStartTime, companyEndTime);
    }

    private static List<Schedule> registerBusinessTripSchedules(BusinessTripDraft businessTripDraft, LocalTime companyStartTime, LocalTime companyEndTime) {
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

        return registerSchedulesWithType(startDate, endDate,
                startAt, endAt, ScheduleType.BUSINESS_TRIP,
                title, content,
                businessTripDraft.getEmp(),
                companyStartTime, companyEndTime);
    }

    private static List<Schedule> registerLeaveSchedules(LeaveDraft leaveDraft, LocalTime companyStartTime, LocalTime companyEndTime) {
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

        return registerSchedulesWithType(startDate, endDate,
                startAt, endAt, ScheduleType.LEAVE,
                title, content,
                leaveDraft.getEmp(),
                companyStartTime, companyEndTime);
    }



    private static List<Schedule> registerSchedulesWithType(LocalDate startDate, LocalDate endDate,
                                                    LocalTime startAt, LocalTime endAt,
                                                    ScheduleType type, String title, String content,
                                                    Emp scheduleOwner,
                                                    LocalTime companyStartAt, LocalTime companyEndAt
    ) {
        List<Schedule> schedules = new ArrayList<>();

        long days = ChronoUnit.DAYS.between(startDate, endDate);

        for(int i = 0; i <= days; i++) {
            Schedule schedule = new Schedule();
            LocalDate targetDate = startDate.plusDays(i);

            schedule.scheduleType = type;
            schedule.title = title;
            schedule.content = content;
            schedule.emp = scheduleOwner;

            if (startDate.equals(endDate)) {
                schedule.isAllDay = (isStartAtCompanyStartTime(startAt, companyStartAt) && isEndAtCompanyEndTime(endAt, companyEndAt));
                schedule.startAt = startAt;
                schedule.endAt = endAt;
            } else if (targetDate.equals(startDate)) {

                schedule.isAllDay = isStartAtCompanyStartTime(startAt, companyStartAt);
                schedule.startAt = startAt;
                schedule.endAt = companyEndAt;

            } else if (targetDate.equals(endDate)) {
                schedule.isAllDay = isEndAtCompanyEndTime(endAt, companyEndAt);
                schedule.startAt = companyStartAt;
                schedule.endAt = endAt;
            } else {
                schedule.isAllDay = true;
                schedule.startAt = companyStartAt;
                schedule.endAt = companyEndAt;
            }

            schedule.scheduleParticipants.add(registerScheduleParticipant(schedule, scheduleOwner));
            schedules.add(schedule);
        }

        return schedules;
    }

    private static boolean isEndAtCompanyEndTime(LocalTime endAt, LocalTime companyEndAt) {
        return endAt.equals(companyEndAt);
    }

    private static boolean isStartAtCompanyStartTime(LocalTime startAt, LocalTime companyStartAt) {
        return startAt.equals(companyStartAt);
    }


    private void changeTime(LocalDate editedOn, LocalTime editedStartAt, LocalTime editedEndAt) {
        this.startAt = requireNonNull(editedStartAt);
        this.endAt = requireNonNull(editedEndAt);
        this.scheduleDate = requireNonNull(editedOn);
    }

    public void cancel() {
        this.isCanceled = true;
    }

}
