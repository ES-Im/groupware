package com.haruon.groupware.domain.empInfo.attendance;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.attendance.dto.AttendanceCloseParam;
import com.haruon.groupware.domain.empInfo.attendance.dto.AttendanceCloseResult;
import com.haruon.groupware.domain.empInfo.attendance.dto.AttendanceEditParam;
import com.haruon.groupware.domain.empInfo.emp.Emp;
import com.haruon.groupware.domain.schedule.Schedule;
import com.haruon.groupware.domain.schedule.ScheduleType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter(AccessLevel.PROTECTED)
public class EmpAttendance extends AbstractEntity {

    private static final long WORKING_HOURS = 8L;
    private static final long BREAK_HOURS = 1L;

    @ManyToOne
    @JoinColumn(name="emp_id", nullable = false)
    private Emp emp;

    @Enumerated(EnumType.STRING)
    @Nullable
    private AttendanceStatus attendanceStatus;

    private LocalDate attendanceDate;

    @Nullable
    private LocalTime startAt;

    @Nullable
    private LocalTime endAt;

    @Nullable
    private LocalDateTime approvedAt;

    @Nullable
    @ManyToOne
    @JoinColumn(name="approved_emp_id", nullable = true)
    private Emp approvedBy;

    @Nullable
    @ManyToOne
    @JoinColumn(name="edited_emp_id", nullable = true)
    private Emp editedBy;

    @Nullable
    private LocalDateTime editedAt;

    @Nullable
    private String editReason;

    public void changeAttendanceByDeptManager(AttendanceEditParam param) {
        requireNonNull(param, "수정 근태정보는 null일 수 없음");
        state(this.approvedAt == null && this.approvedBy == null, "승인 후에는 수정 불가");

        this.startAt = param.startAt() == null ? this.startAt : param.startAt();
        this.endAt = param.endAt() == null ? this.endAt : param.endAt();

        if (this.startAt != null && this.endAt != null) {
            state(this.endAt.isAfter(this.startAt), "종료시각은 시작시각보다 늦어야 함");
        }

        if (param.status() == AttendanceStatus.NORMAL) {
            state(this.startAt != null && this.endAt != null,
                    "정상근무로 변경하려면 시작시각과 종료시각이 모두 필요함");
            this.attendanceStatus = getStatusByRecognizedHours(this.startAt, this.endAt, false);

        } else if (param.status() != null) {
            this.attendanceStatus = param.status();
        }

        this.editedAt = param.editedAt();
        this.editReason = param.editReason();
        this.editedBy = param.editedBy();
    }

    public void approveAttendance(Emp approver, LocalDateTime approvedAt) {
        state(this.approvedAt == null && this.approvedBy == null, "승인 후에는 승인 불가");

        this.approvedBy = approver;
        this.approvedAt = approvedAt;
    }

    public static EmpAttendance registerAttendanceByEmp(Emp emp, LocalDateTime startAt) {
        EmpAttendance empAttendance = new EmpAttendance();

        empAttendance.emp = requireNonNull(emp);
        empAttendance.attendanceDate = requireNonNull(startAt.toLocalDate());
        empAttendance.startAt = requireNonNull(startAt.toLocalTime());

        return empAttendance;
    }

    public void recordEndAtByEmp(LocalDateTime endAt) {
        state(this.startAt!= null ,"당일 출근기록 없음");
        state(endAt != null, "퇴근시각 미입력");
        state(!endAt.toLocalTime().isBefore(this.startAt), "퇴근시각은 출근시각보다 빠를 수 없음");

        this.endAt = endAt.toLocalTime();
    }

    public AttendanceCloseResult closeAttendance (
            AttendanceCloseParam param
    ) {
        requireNonNull(param);

        if(param.schedules().isEmpty()) return confirmWithoutSchedule(param);     // 스케쥴 없음

        Schedule allDaySchedule
                = param.schedules().stream()
                    .filter(Schedule::isAllDay)
                    .findFirst().orElse(null);

        if(allDaySchedule != null) return closeDayWithAllDaySchedule(param, allDaySchedule);    // 종일 일정있음

        return closeDayPartialSchedule(param);  // 부분 일정있음
    }

    private AttendanceCloseResult confirmWithoutSchedule(AttendanceCloseParam param) {

        if(param.empAttendance() == null) return new AttendanceCloseResult(registerAbsentAttendance(param.emp(), param.attendanceDate()), List.of());

        EmpAttendance empAttendance = param.empAttendance();

        if(param.empAttendance().endAt == null) {
            empAttendance.attendanceStatus = AttendanceStatus.ABSENT;
        } else {
            empAttendance.attendanceStatus = getStatusByRecognizedHours(empAttendance.startAt, empAttendance.getEndAt(), false);
        }

        return new AttendanceCloseResult(empAttendance, List.of());
    }

    private static AttendanceCloseResult closeDayWithAllDaySchedule(
            AttendanceCloseParam param,
            Schedule allDaySchedules
    ) {

        ScheduleType type = allDaySchedules.getScheduleType();
        state(type != null, "일정 타입은 null이 될 수 없음");

        EmpAttendance attendance = new EmpAttendance();
        attendance.emp = param.emp();


        switch (type) {
            case LEAVE -> {
                attendance.attendanceDate = allDaySchedules.getScheduleDate();
                attendance.attendanceStatus = AttendanceStatus.ALL_DAY_LEAVE;
            }
            case BUSINESS_TRIP -> {
                attendance.attendanceDate = allDaySchedules.getScheduleDate();
                attendance.attendanceStatus = AttendanceStatus.NORMAL;
                attendance.startAt = allDaySchedules.getStartAt();
                attendance.endAt = allDaySchedules.getEndAt();
            }
        }

        return new AttendanceCloseResult(attendance, List.of());
    }

    private AttendanceCloseResult closeDayPartialSchedule(AttendanceCloseParam param) {
        List<Schedule> schedules = param.schedules();
        EmpAttendance mainAttendance = param.empAttendance();
        List<EmpAttendance> subAttendances = new ArrayList<>();

        LocalTime entireStartAt = mainAttendance != null ? mainAttendance.startAt : null;
        LocalTime entireEndAt = mainAttendance != null ? mainAttendance.endAt : null;

        boolean isIncludeLeave = false;

        for (Schedule schedule : schedules) {
            LocalTime scheduleStartAt = schedule.getStartAt();
            LocalTime scheduleEndAt = schedule.getEndAt();

            if (schedule.getScheduleType() == ScheduleType.BUSINESS_TRIP) { // 출장이라면 메인 언텐 시간 조정만
                entireStartAt = getEarlierTime(entireStartAt, scheduleStartAt);
                entireEndAt = getLaterTime(entireEndAt, scheduleEndAt);
            }

            if (schedule.getScheduleType() == ScheduleType.LEAVE) { // 연차라면 아예 서브 어탠 객체 생성해서 리스트에 넣기
                EmpAttendance subAttendance = new EmpAttendance();
                subAttendance.emp = schedule.getEmp();
                subAttendance.attendanceStatus = AttendanceStatus.HALF_DAY_LEAVE;
                subAttendance.startAt = scheduleStartAt;
                subAttendance.endAt = scheduleEndAt;
                subAttendance.attendanceDate = schedule.getScheduleDate();
                subAttendances.add(subAttendance);

                isIncludeLeave = true;
            }
        }

        if (mainAttendance == null) {       // 메인 어탠 없는 상황이라면
            if (entireStartAt == null || entireEndAt == null) { // 출장시각으로 조정했는데도 없다면
                return new AttendanceCloseResult(
                        registerAbsentAttendance(param.emp(), param.attendanceDate()),  // 결근 기록으로 넘기기
                        subAttendances
                );
            }

            mainAttendance = new EmpAttendance();

            mainAttendance.emp = requireNonNull(param.emp());
            mainAttendance.attendanceDate = requireNonNull(param.attendanceDate());  // 일단 메인어탠 직원정보랑 날짜정보 적고
        }

        if (entireStartAt == null || entireEndAt == null) {
            mainAttendance.attendanceStatus = AttendanceStatus.ABSENT;      // 조정한 시간이 null이면 결근으로 찍고

            return new AttendanceCloseResult(mainAttendance, subAttendances);
        }

        mainAttendance.startAt = entireStartAt;     // 조정한 시간 있으면 시간 고치고 상태 확인해서 메인 어탠 수정해서 넘기기
        mainAttendance.endAt = entireEndAt;
        mainAttendance.attendanceStatus =
                getStatusByRecognizedHours(mainAttendance.startAt, mainAttendance.endAt, isIncludeLeave);

        return new AttendanceCloseResult(mainAttendance, subAttendances);
    }

    private LocalTime getEarlierTime(LocalTime targetStartAt, LocalTime baseTime) {
        return (targetStartAt == null || targetStartAt.isAfter(baseTime))? baseTime : targetStartAt;
    }

    private LocalTime getLaterTime(LocalTime targetStartAt, LocalTime baseTime) {
        return (targetStartAt == null || targetStartAt.isBefore(baseTime))? baseTime : targetStartAt;
    }

    private EmpAttendance registerAbsentAttendance(Emp emp, LocalDate date) {
        EmpAttendance absentAttendance = new EmpAttendance();
        absentAttendance.emp = requireNonNull(emp);
        absentAttendance.attendanceStatus = AttendanceStatus.ABSENT;
        absentAttendance.attendanceDate = date;

        return absentAttendance;
    }

    private AttendanceStatus getStatusByRecognizedHours(
            LocalTime startAt, LocalTime endAt, boolean includeHalfLeave
    ) {
        long normalWorkHours = WORKING_HOURS - BREAK_HOURS;
        if(includeHalfLeave) normalWorkHours /= 2;

        long recognizedWorkHours = getWorkHours(startAt, endAt);

        if(recognizedWorkHours >= normalWorkHours) {
            return AttendanceStatus.NORMAL;
        }

        if(recognizedWorkHours * 2 >= normalWorkHours) {
            return AttendanceStatus.LATE_EARLY;
        }

        return AttendanceStatus.ABSENT;
    }

    private static long getWorkHours(LocalTime startAt, LocalTime endAt) {
        return Duration.between(requireNonNull(startAt), endAt).toHours();
    }

}
