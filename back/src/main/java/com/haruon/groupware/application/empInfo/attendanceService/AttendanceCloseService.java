package com.haruon.groupware.application.empInfo.attendanceService;

import com.haruon.groupware.application.CompanyPolicyPort;
import com.haruon.groupware.application.empInfo.attendanceService.dto.AttendanceCloseParam;
import com.haruon.groupware.application.empInfo.attendanceService.dto.AttendanceCloseResult;
import com.haruon.groupware.application.empInfo.provided.AttendanceClosing;
import com.haruon.groupware.application.empInfo.required.AttendanceRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.domain.empInfo.Attendance;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;
import com.haruon.groupware.domain.schedule.Schedule;
import com.haruon.groupware.domain.schedule.ScheduleType;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static com.haruon.groupware.application.empInfo.attendanceService.AttendanceUtils.*;
import static com.haruon.groupware.domain.empInfo.Attendance.*;
import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Service
@Transactional
@RequiredArgsConstructor
@Validated
public class AttendanceCloseService implements AttendanceClosing {

    private final AttendanceRepository attendanceRepository;
    private final EmpRepository empRepository;
    private final CompanyPolicyPort port;
    private final ScheduleRepository scheduleRepository;

    private static final List<ScheduleType> SCHEDULE_FOR_ATTENDANCE_DECISION = List.of(
            ScheduleType.BUSINESS_TRIP, ScheduleType.LEAVE
    );

    @Override
    public int closeAttendance(AttendanceCloseParam param) {
        requireNonNull(param);

        List<Schedule> schedules = findSchedules(param.empId(), param.attendanceDate());

        if(schedules.isEmpty()) return confirmWithoutSchedule(param);

        Schedule allDaySchedule = schedules.stream()
                                           .filter(Schedule::isAllDay)
                                           .findFirst().orElse(null);

        if(allDaySchedule != null) return closeDayWithAllDaySchedule(param);

        AttendanceCloseResult result = closeDayPartialSchedule(param);

        applyCloseResult(result);

        return 1;
    }

    private int confirmWithoutSchedule(AttendanceCloseParam param) {

        Attendance attendance = findAttendanceByCloseParam(param);

        if(attendance == null) {
            registerAttendanceForClose(
                    findEmpById(empRepository, param.empId()),
                    param.attendanceDate(),
                    AttendanceStatus.ABSENT,
                    null, null
            );
        } else {
            AttendanceStatus status =
                    (attendance.getEndAt() == null) ?
                    AttendanceStatus.ABSENT :
                    getStatusByRecognizedHours(
                        attendance.getStartAt(),
                        attendance.getEndAt(),
                        port.getWorkHours(),
                        false
                    );

            changeAttendanceStatus(attendance, status);
        }

        return 1;
    }

    private int closeDayWithAllDaySchedule(AttendanceCloseParam param) {

        List<Schedule> schedules = findSchedules(param.empId(), param.attendanceDate());
        state(schedules.size() == 1, "잘못된 일정포함 관리자 확인 필요");

        Schedule schedule = schedules.getFirst();
        Attendance mainAttendance = findAttendanceByCloseParam(param);
        Emp emp = findEmpById(empRepository, param.empId());

        AttendanceStatus status;
        LocalTime startAt = null;
        LocalTime endAt = null;

        switch (schedule.getScheduleType()) {
            case LEAVE -> status = AttendanceStatus.ALL_DAY_LEAVE;
            case BUSINESS_TRIP -> {
                startAt = schedule.getStartAt();
                endAt = schedule.getEndAt();
                status = AttendanceStatus.NORMAL;
            }
            default -> throw new IllegalStateException("지원하지 않는 일정 타입");
        }

        if (mainAttendance == null) {
            registerAttendanceForClose(emp, param.attendanceDate(), status, startAt, endAt);
        } else {
            if (startAt != null && endAt != null) {
                changeAttendanceTime(mainAttendance, startAt, endAt);
            }
            changeAttendanceStatus(mainAttendance, status);
        }

        return 1;
    }

    private AttendanceCloseResult closeDayPartialSchedule(AttendanceCloseParam param) {

        List<Schedule> schedules = findSchedules(param.empId(), param.attendanceDate());
        Attendance mainAttendance = findAttendanceByCloseParam(param);
        Emp emp = findEmpById(empRepository, param.empId());

        List<Attendance> subAttendances = new ArrayList<>();

        LocalTime entireStartAt = mainAttendance != null ? mainAttendance.getStartAt() : null;
        LocalTime entireEndAt = mainAttendance != null ? mainAttendance.getEndAt() : null;

        boolean isIncludeLeave = false;

        for(Schedule schedule : schedules) {
            LocalTime scheduleStartAt = schedule.getStartAt();
            LocalTime scheduleEndAt = schedule.getEndAt();

            if (schedule.getScheduleType() == ScheduleType.BUSINESS_TRIP) {
                entireStartAt = getEarlierTime(entireStartAt, scheduleStartAt);
                entireEndAt = getLaterTime(entireEndAt, scheduleEndAt);
            }
            if (schedule.getScheduleType() == ScheduleType.LEAVE) {
                subAttendances.add(registerAttendanceForClose(
                        emp,
                        schedule.getScheduleDate(),
                        AttendanceStatus.HALF_DAY_LEAVE,
                        scheduleStartAt,
                        scheduleEndAt
                ));
                isIncludeLeave = true;
            }
        }

        if (entireStartAt == null || entireEndAt == null) {
            Attendance absentAttendance = resolveOrRegisterAbsentAttendance(param, mainAttendance, emp);
            return new AttendanceCloseResult(absentAttendance, subAttendances);
        }

        Attendance resolvedMainAttendance = resolveMainAttendance(param, mainAttendance, emp, entireStartAt, entireEndAt, isIncludeLeave);
        return new AttendanceCloseResult(resolvedMainAttendance, subAttendances);
    }

    private Attendance resolveOrRegisterAbsentAttendance(
            AttendanceCloseParam param,
            Attendance mainAttendance,
            Emp emp
    ) {
        if (mainAttendance == null) {
            return registerAttendanceForClose(
                    emp,
                    param.attendanceDate(),
                    AttendanceStatus.ABSENT,
                    null,
                    null
            );
        }

        changeAttendanceStatus(mainAttendance, AttendanceStatus.ABSENT);
        return mainAttendance;
    }

    private Attendance resolveMainAttendance(
            AttendanceCloseParam param,
            Attendance mainAttendance,
            Emp emp,
            LocalTime startAt,
            LocalTime endAt,
            boolean isIncludeLeave
    ) {
        AttendanceStatus status = getStatusByRecognizedHours(
                startAt,
                endAt,
                port.getWorkHours(),
                isIncludeLeave
        );

        if (mainAttendance == null) {
            return registerAttendanceForClose(
                    emp,
                    param.attendanceDate(),
                    status,
                    startAt,
                    endAt
            );
        }

        changeAttendanceTime(mainAttendance, startAt, endAt);
        changeAttendanceStatus(mainAttendance, status);
        return mainAttendance;
    }

    private void applyCloseResult(AttendanceCloseResult result) {
        requireNonNull(result, "마감 결과가 없음");

        attendanceRepository.save(result.mainAttendance());

        if (!result.subAttendances().isEmpty()) {
            attendanceRepository.saveAll(result.subAttendances());
        }
    }

    private List<Schedule> findSchedules(Long empId, LocalDate targetDate) {
        List<Schedule> schedules = scheduleRepository.findByEmp_IdAndScheduleDate(empId, targetDate);

        return schedules.stream()
                .filter(s -> !s.isCanceled())
                .filter(s -> SCHEDULE_FOR_ATTENDANCE_DECISION.contains(s.getScheduleType()))
                .toList();
    }

    private Attendance findAttendanceByCloseParam(AttendanceCloseParam param) {
        return attendanceRepository.findByEmpIdAndAttendanceDate(
                param.empId(), param.attendanceDate()
        ).orElse(null);
    }

}
