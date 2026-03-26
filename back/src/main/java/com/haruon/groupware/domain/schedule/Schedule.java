package com.haruon.groupware.domain.schedule;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.emp.Emp;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import static com.haruon.groupware.domain.schedule.ScheduleParticipant.registerScheduleParticipant;
import static java.util.Objects.requireNonNull;

@Entity
@Getter
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

    public static List<Schedule> createPersonal(RegisterPersonalScheduleParam param) {
        requireNonNull(param, "등록 정보가 없음");

        List<Schedule> schedules = new ArrayList<>();

        LocalDate startDate = param.startedAt().toLocalDate();
        LocalDate endDate = param.endAt().toLocalDate();

        long days = ChronoUnit.DAYS.between(startDate, endDate);

        for(int i = 0; i <= days; i++) {
            Schedule schedule = new Schedule();
            LocalDate targetDate = startDate.plusDays(i);

// param에 회사 정책(env.yml)값 넣어두고 이 부분 건드는 중임 LocalTime.MIN = companyStartAt 이고 Max = companyEndAt임
//            if (startDate.equals(endDate)) {
//                schedule.startAt = param.startedAt().toLocalTime();
//                schedule.endAt = param.endAt().toLocalTime();
//            } else if (targetDate.equals(startDate)) {
//                schedule.startAt = param.startedAt().toLocalTime();
//                schedule.endAt = LocalTime.MAX;
//            } else if (targetDate.equals(endDate)) {
//                schedule.startAt = LocalTime.MIN;
//                schedule.endAt = param.endAt().toLocalTime();
//            } else {
//                schedule.startAt = LocalTime.MIN;
//                schedule.endAt = LocalTime.MAX;
            }

            schedules.add(schedule);
            registerScheduleParticipant(schedule, param.owner());
        }


        schedules.forEach(s -> {
            s.scheduleType = ScheduleType.MANUAL;
            s.title = param.title();
            s.content = param.content();
            s.emp = param.owner();
            s.isAllDay = param.isAllDay();
            s.isForDivision = param.isForDivision();
        });

        return schedules;
    }

//    public static Schedule createFromLeave(Emp owner, Leave leave) {
//
//    }
//
//    public static Schedule createFromBusinessTrip(Emp owner, BusinessTrip trip) {
//
//    }
//
//    public static Schedule createFromMeeting(Emp owner, Meeting meeting) {
//
//    }
//
//    public static Schedule createFromSource() {
//
//    }
//
//    public void changeBasicInfo() {
//
//    }

    private void changeTime(LocalDate editedOn, LocalTime editedStartAt, LocalTime editedEndAt) {
        this.startAt = requireNonNull(editedStartAt);
        this.endAt = requireNonNull(editedEndAt);
        this.scheduleDate = requireNonNull(editedOn);
    }

    public void cancel() {
        this.isCanceled = true;
    }

}
