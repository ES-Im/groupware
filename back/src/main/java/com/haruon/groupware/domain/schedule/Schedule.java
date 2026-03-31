package com.haruon.groupware.domain.schedule;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.*;
import lombok.Getter;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"schedule_type", "source_id", "owner_emp_id", "schedule_date"})
)
public class Schedule extends AbstractEntity {

    @Nullable
    private Long sourceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ScheduleType scheduleType;

    @ManyToOne
    @JoinColumn(name = "owner_emp_id",  nullable = false)
    private Emp emp;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String content;

    @Column(nullable = false)
    LocalDate scheduleDate;

    @Column(nullable = false)
    LocalTime startAt;

    @Column(nullable = false)
    LocalTime endAt;

    @Column(nullable = false)
    private boolean isAllDay;

    @Column(nullable = false)
    private boolean isCanceled;

    @Column(nullable = false)
    private boolean isPublic;

    @OneToMany(mappedBy = "schedule", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScheduleParticipant> scheduleParticipants = new ArrayList<>();


    public static Schedule registerSchedule(
            @Nullable Long sourceId,
            ScheduleType type,
            Emp emp,
            String title, String content,
            LocalDate scheduleDate,
            LocalTime startAt, LocalTime endAt,
            boolean isAllDay, boolean isPublic) {
        Schedule schedule = new Schedule();

        state(!endAt.isBefore(startAt), "종료시간은 시작시간보다 이를 수 없음");

        schedule.sourceId = sourceId;
        schedule.scheduleType = requireNonNull(type);
        schedule.emp = requireNonNull(emp);
        schedule.title = requireNonNull(title);
        schedule.content = requireNonNull(content);
        schedule.scheduleDate = requireNonNull(scheduleDate);
        schedule.startAt = requireNonNull(startAt);
        schedule.endAt = requireNonNull(endAt);
        schedule.isAllDay = isAllDay;
        schedule.isCanceled = false;
        schedule.isPublic = isPublic;

        return schedule;
    }

    public void cancel() {
        this.isCanceled = true;
    }

    public void addParticipant(Emp emp) {
        requireNonNull(emp);

        ScheduleParticipant participant = findParticipant(emp);
        state(participant == null, "이미 참여 중인 사원");

        this.scheduleParticipants.add(ScheduleParticipant.registerScheduleParticipant(this, emp));
    }

    public void removeParticipant(Emp emp) {
        requireNonNull(emp);

        ScheduleParticipant participant = findParticipant(emp);
        state(participant != null, "기존 참여하지 않는 사원");

        this.scheduleParticipants.remove(participant);
    }

    private ScheduleParticipant findParticipant(Emp emp) {
        return this.scheduleParticipants.stream()
                .filter(s -> s.getEmp().equals(emp))
                .findAny().orElse(null);
    }

    // to-do - 얘를 유효성 검증하는 메서드로 만들면 될거 같음. 조립 책임을 서비스로 올리다보니 필요없어졌는데..
    // 괜히 빠지니까 불안하네 코드 재검토 하고, 리팩토링한거 중에 빠진 부분있는지 검토해볼것
//    private boolean resolveAttendance(AttendanceCloseParam param) {
//        Attendance attendance = param.attendanceId();
//
//        if(attendance != null) {
//            state(attendance.getStartAt() != null, "출근기록 없음");
//            state(attendance.getAttendanceDate() != null, "근태날짜 없음");
//        }
//
//        requireNonNull(schedules, "스케줄없으면, 빈 ArrayList 객체로 넣을 것");
//
//        if(!schedules.isEmpty()) {
//            schedules.forEach(s -> requireNonNull(s, "스케쥴 목록에 null 불가"));
//
//            schedules = schedules.stream()  // 취소 안된거
//                    .filter(s -> s.getScheduleType().equals(ScheduleType.BUSINESS_TRIP)
//                            || s.getScheduleType().equals(ScheduleType.LEAVE))
//                    .filter(s -> !s.isCanceled())
//                    .toList();
//
//            List<Schedule> allDaySchedules = schedules.stream() // 종일 일정인거
//                    .filter(Schedule::isAllDay)
//                    .toList();
//
//            state(allDaySchedules.size() <= 1, "종일 일정은 1개만 허용됨");
//
//            if (!allDaySchedules.isEmpty()) {
//                state(schedules.size() == 1, "종일 일정이 있으면 다른 일정은 함께 들어갈 수 없음");
//            }
//
//            List<Schedule> halfLeaveSchedules = schedules.stream()
//                    .filter(s -> s.getScheduleType().equals(ScheduleType.LEAVE))
//                    .toList();
//            state(halfLeaveSchedules.size() <= 1, "연차는 하루에 1개만 허용됨");
//
//            schedules.stream()
//                    .filter(s -> !s.isAllDay())
//                    .forEach(s -> {
//                        state(s.getStartAt() != null, "일정의 시작시각 없음");
//                        state(s.getEndAt() != null, "일정의 종료시각 없음");
//                        state(s.getEndAt().isAfter(s.getStartAt()), "일정 종료시각은 시작시각보다 빠를 수 없음");
//                    });
//        }
//    }

}
