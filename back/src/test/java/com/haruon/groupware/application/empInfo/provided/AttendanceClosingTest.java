package com.haruon.groupware.application.empInfo.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.attendanceService.AttendanceClosing;
import com.haruon.groupware.application.empInfo.attendanceService.dto.AttendanceCloseParam;
import com.haruon.groupware.application.empInfo.required.AttendanceRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.application.utils.CompanyPolicyPort;
import com.haruon.groupware.domain.empInfo.Attendance;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;
import com.haruon.groupware.domain.schedule.Schedule;
import com.haruon.groupware.domain.schedule.ScheduleType;
import lombok.Builder;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Stream;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static com.haruon.groupware.domain.schedule.Schedule.registerSchedule;
import static org.assertj.core.api.Assertions.assertThat;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestIntegrationConfig
record AttendanceClosingTest(
        AttendanceClosing attendanceClosing,
        AttendanceRecord attendanceRecord,
        AttendanceRepository attendanceRepository,

        EmpRepository empRepository,
        ScheduleRepository scheduleRepository,
        CompanyPolicyPort companyPolicy
) {

    @AfterEach
    void tearDown() {
        scheduleRepository.deleteAll();
        attendanceRepository.deleteAll();
        empRepository.deleteAll();
    }


    private Stream<Arguments> attendanceWithoutSchedulesArguments() {

        Integer requiredTime = companyPolicy.getWorkHours();
        LocalTime companyStartTime = companyPolicy.getStartTime();
        LocalTime companyEndTime = companyPolicy.getEndTime();

        LocalTime halfEndTime = companyStartTime.plusHours(requiredTime / 2);
        LocalTime lessThanHalfEndTime = companyStartTime.plusMinutes(requiredTime / 2).minusMinutes(1);

        return Stream.of(
                Arguments.of("근무시간을 소정근로시간 100% 채우면, 근태상태는 'NORMAL(정상출근)'이다"
                        , AttendanceStatus.NORMAL, companyStartTime, companyEndTime
                ), Arguments.of("근무시간을 소정근로시간 중 50%이상, 100%미만으로 채우면, 근태상태는 'LATE_EARLY(지각 및 조퇴)'이다"
                        , AttendanceStatus.LATE_EARLY
                        , companyStartTime
                        , halfEndTime
                ), Arguments.of("근무시간을 소정근로시간 50% 미만이면, 근태상태는 'ABSENT(결근)'이다."
                        , AttendanceStatus.ABSENT
                        , companyStartTime
                        , lessThanHalfEndTime
                ), Arguments.of("출근기록만 있고, 퇴근기록이 없는 경우, 근태상태는 'ABSENT(결근)'이다."
                        , AttendanceStatus.ABSENT
                        , companyStartTime
                        , null
                )
        );

    }

    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("attendanceWithoutSchedulesArguments")
    @DisplayName("근태마감 테스트 - confirmWithoutSchedule")
    void closeAttendance_without_schedules(String description, AttendanceStatus expectedStatus, LocalTime startAt, LocalTime endAt) {
        Emp emp = saveApprovedEmp(empRepository);
        LocalDate date = LocalDate.of(2026, 1, 1);
        saveAttendanceByClosing(emp, date, startAt, endAt);
        AttendanceCloseParam attendanceCloseParam = new AttendanceCloseParam(emp.getId(), date);

        attendanceClosing.closeAttendance(attendanceCloseParam);

        attendanceRepository.findByEmpIdAndAttendanceDate(emp.getId(), date).stream().findFirst().ifPresent(att -> {
            assertThat(att.getAttendanceStatus()).isEqualTo(expectedStatus);
            assertThat(att.getStartAt()).isEqualTo(startAt);
            assertThat(att.getEndAt()).isEqualTo(endAt);
        });

    }

    private Stream<Arguments> attendanceWithBusinessTripSchedulesPartOfDayArguments() {
        Integer requiredTime = companyPolicy.getWorkHours();
        LocalTime companyStartTime = companyPolicy.getStartTime();
        LocalTime companyEndTime = companyPolicy.getEndTime();

        LocalTime halfEndTime = companyStartTime.plusHours(requiredTime / 2);
        LocalTime lessThanHalfEndTime = companyStartTime.plusMinutes(requiredTime / 2).minusMinutes(1);

        return Stream.of(
                Arguments.of(
                        "출장일 때, 출퇴근 기록이 없으면 출장 시간으로 반영된다",
                        companyStartTime, companyEndTime,
                        null, null,
                        companyStartTime, companyEndTime,
                        AttendanceStatus.NORMAL
                ),
                Arguments.of(
                        "출장일 때, 출근이 출장 시작보다 늦으면 시작시간은 출장 시작으로 보정된다",
                        companyStartTime, companyEndTime,
                        companyStartTime.plusHours(1), companyEndTime,
                        companyStartTime, companyEndTime,
                        AttendanceStatus.NORMAL
                ),
                Arguments.of(
                        "출장일 때, 퇴근이 출장 종료보다 이르면 종료시간은 출장 종료로 보정된다",
                        companyStartTime, companyEndTime,
                        companyStartTime, companyEndTime.minusHours(1),
                        companyStartTime, companyEndTime,
                        AttendanceStatus.NORMAL
                ),
                Arguments.of(
                        "출장시간 반영 후 소정근로시간 50% 이상 100% 미만이면 LATE_EARLY",
                        companyStartTime, halfEndTime,
                        null, null,
                        companyStartTime, halfEndTime,
                        AttendanceStatus.LATE_EARLY
                ),
                Arguments.of(
                        "출장시간 반영 후 소정근로시간 50% 미만이면 ABSENT",
                        companyStartTime, lessThanHalfEndTime,
                        null, null,
                        companyStartTime, lessThanHalfEndTime,
                        AttendanceStatus.ABSENT
                )
        );
    }
    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("attendanceWithBusinessTripSchedulesPartOfDayArguments")
    @DisplayName("근태마감 테스트 - closeDayWithBusinessSchedule")
    void closeAttendance_with_Business_schedule_PartOfDay(
            String description,
            @Nullable LocalTime tripStartAt,
            @Nullable LocalTime tripEndAt,
            @Nullable LocalTime workStartAt,
            @Nullable LocalTime workEndAt,
            @Nullable LocalTime expectedStartAt,
            @Nullable LocalTime expectedEndAt,
            AttendanceStatus expectedAttendanceStatus
    ) {
        Emp emp = saveApprovedEmp(empRepository);
        LocalDate date = LocalDate.of(2026, 1, 1);

        if(workStartAt != null) saveAttendanceByClosing(emp, date, workStartAt, workEndAt);

        Schedule schedule = registerSchedule(
                "any", ScheduleType.BUSINESS_TRIP,
                emp, "출장", "내용",
                date, tripStartAt, tripEndAt,
                false, false
        );
        scheduleRepository.save(schedule);

        AttendanceCloseParam param = new AttendanceCloseParam(emp.getId(), date);
        attendanceClosing.closeAttendance(param);

        attendanceRepository.findByEmpIdAndAttendanceDate(emp.getId(), date).stream().findFirst().ifPresent(att -> {
                    assertThat(att.getStartAt()).isEqualTo(expectedStartAt);
                    assertThat(att.getEndAt()).isEqualTo(expectedEndAt);
                    assertThat(att.getAttendanceStatus()).isEqualTo(expectedAttendanceStatus);
        });
    }

    @Builder
    record LeaveParamPartOfDay(
            @Nullable LocalTime leaveStartAt,
            @Nullable LocalTime leaveEndAt,
            @Nullable LocalTime workStartAt,
            @Nullable LocalTime workEndAt,
            @Nullable LocalTime expectedLeaveStartAt,
            @Nullable LocalTime expectedLeaveEndAt,
            @Nullable LocalTime expectedWorkStartAt,
            @Nullable LocalTime expectedWorkEndAt,
            @Nullable AttendanceStatus expectedAttendanceStatus
    ) {}

    private Stream<Arguments> attendanceWithLeaveSchedulesPartOfDayArguments() {
        Integer requiredTime = companyPolicy.getWorkHours();
        LocalTime companyStartTime = companyPolicy.getStartTime();
        LocalTime companyEndTime = companyPolicy.getEndTime();

        LocalTime leaveStartAt = companyStartTime;
        LocalTime leaveEndAt = companyStartTime.plusHours(requiredTime / 2);

        LocalTime workStartAt = leaveEndAt.minusMinutes(1);
        LocalTime normalWorkEndAt = companyEndTime;

        return Stream.of(
                Arguments.of(
                        "(소정근로시간 - 반차시간)의 100% 이상 근무하면 근로상태는 정상근무이다.",
                        LeaveParamPartOfDay.builder()
                                .leaveStartAt(leaveStartAt)
                                .leaveEndAt(leaveEndAt)
                                .workStartAt(workStartAt)
                                .workEndAt(normalWorkEndAt)
                                .expectedLeaveStartAt(leaveStartAt)
                                .expectedLeaveEndAt(leaveEndAt)
                                .expectedWorkStartAt(workStartAt)
                                .expectedWorkEndAt(normalWorkEndAt)
                                .expectedAttendanceStatus(AttendanceStatus.NORMAL)
                            .build()
                ), Arguments.of(
                        "(소정근로시간 - 반차시간)의 50%이상, 100%미만을 일하면 근로상태는 '조퇴 및 지각'이다.",
                        LeaveParamPartOfDay.builder()
                                .leaveStartAt(leaveStartAt)
                                .leaveEndAt(leaveEndAt)
                                .workStartAt(workStartAt)
                                .workEndAt(normalWorkEndAt.minusMinutes(5))
                                .expectedLeaveStartAt(leaveStartAt)
                                .expectedLeaveEndAt(leaveEndAt)
                                .expectedWorkStartAt(workStartAt)
                                .expectedWorkEndAt(normalWorkEndAt.minusMinutes(5))
                                .expectedAttendanceStatus(AttendanceStatus.LATE_EARLY)
                                .build()
                ), Arguments.of(
                        "(소정근로시간 - 반차시간)의 50%미만을 일하면 근로상태는 '결근'이다.",
                        LeaveParamPartOfDay.builder()
                                .leaveStartAt(leaveStartAt)
                                .leaveEndAt(leaveEndAt)
                                .workStartAt(workStartAt)
                                .workEndAt(normalWorkEndAt.minusMinutes(5))
                                .expectedLeaveStartAt(leaveStartAt)
                                .expectedLeaveEndAt(leaveEndAt)
                                .expectedWorkStartAt(workStartAt)
                                .expectedWorkEndAt(workStartAt.plusMinutes(5))
                                .expectedAttendanceStatus(AttendanceStatus.ABSENT)
                                .build()
                ), Arguments.of(
                        "반차가 있는 날 근무시간 기록이 없다면 근로상태는 '결근'이다.",
                        LeaveParamPartOfDay.builder()
                                .leaveStartAt(leaveStartAt)
                                .leaveEndAt(leaveEndAt)
                                .workStartAt(null)
                                .workEndAt(null)
                                .expectedLeaveStartAt(leaveStartAt)
                                .expectedLeaveEndAt(leaveEndAt)
                                .expectedWorkStartAt(null)
                                .expectedWorkEndAt(null)
                                .expectedAttendanceStatus(AttendanceStatus.ABSENT)
                                .build()
                )
        );
    }

    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("attendanceWithLeaveSchedulesPartOfDayArguments")
    @DisplayName("반차가 있는 날은 해당날짜의 각 사원의 근로 데이터가 2개 생성된다. 근로상태 테스트 케이스")
    void closeAttendance_with_half_leave_schedule(String description, LeaveParamPartOfDay param) {
        Emp emp = saveApprovedEmp(empRepository);
        LocalDate date = LocalDate.of(2026, 1, 1);

        if(param.workStartAt != null) saveAttendanceByClosing(emp, date, param.workStartAt, param.workEndAt);

        Schedule schedule = registerSchedule(
                "any", ScheduleType.LEAVE,
                emp, "반차", "내용",
                date, param.leaveStartAt, param.leaveEndAt,
                false, false
        );
        scheduleRepository.save(schedule);

        AttendanceCloseParam closeParam = new AttendanceCloseParam(emp.getId(), date);
        attendanceClosing.closeAttendance(closeParam);

        List<Attendance> attendances = attendanceRepository.findByEmpIdAndAttendanceDate(emp.getId(), date);

        assertThat(attendances).hasSize(2);

        attendances.stream()
                .filter(att -> att.getAttendanceStatus() == param.expectedAttendanceStatus)
                .findFirst()
                .ifPresent(att -> {
                    assertThat(att.getStartAt()).isEqualTo(param.expectedWorkStartAt);
                    assertThat(att.getEndAt()).isEqualTo(param.expectedWorkEndAt);
                });

        attendances.stream()
                .filter(att -> att.getAttendanceStatus() == AttendanceStatus.HALF_DAY_LEAVE)
                .findFirst()
                .ifPresent(att -> {
                    assertThat(att.getStartAt()).isEqualTo(param.expectedLeaveStartAt);
                    assertThat(att.getEndAt()).isEqualTo(param.expectedLeaveEndAt);
                });
    }

    @Test
    @DisplayName("종일 출장 업무 시, 일정 시작시간과 종료시간 상관없이 정상근로시간으로 기록된다.")
    void closeAttendance_with_AllDay_Business_schedule() {
        Emp emp = saveApprovedEmp(empRepository);
        LocalDate date = LocalDate.of(2026, 1, 1);

        LocalTime companyStartTime = companyPolicy.getStartTime();
        LocalTime companyEndTime = companyPolicy.getEndTime();
        LocalTime startTime = companyStartTime.minusHours(1);
        LocalTime endTime = companyEndTime.minusHours(1);
        Schedule schedule = registerSchedule(
                "any", ScheduleType.BUSINESS_TRIP,
                emp, "출장", "내용",
                date, startTime, endTime,
                true, false
        );
        scheduleRepository.save(schedule);

        AttendanceCloseParam param = new AttendanceCloseParam(emp.getId(), date);
        attendanceClosing.closeAttendance(param);

        Attendance att = attendanceRepository.findByEmpIdAndAttendanceDate(emp.getId(), date)
                .stream().findFirst()
                .orElseThrow(() -> new AssertionError("근태가 저장되지 않았습니다."));

        assertThat(att.getStartAt()).isEqualTo(companyStartTime);
        assertThat(att.getEndAt()).isEqualTo(companyEndTime);
        assertThat(att.getAttendanceStatus()).isEqualTo(AttendanceStatus.NORMAL);
    }

    @Test
    @DisplayName("종일 연가 시, 일정 시작시간과 종료시간 상관없이 정상근로시간으로 기록된다.")
    void closeAttendance_with_AllDay_Leave_schedule() {
        Emp emp = saveApprovedEmp(empRepository);
        LocalDate date = LocalDate.of(2026, 1, 1);

        LocalTime companyStartTime = companyPolicy.getStartTime();
        LocalTime companyEndTime = companyPolicy.getEndTime();
        LocalTime startTime = companyStartTime.minusHours(1);
        LocalTime endTime = companyEndTime.minusHours(1);
        Schedule schedule = registerSchedule(
                "any", ScheduleType.LEAVE,
                emp, "연가", "내용",
                date, startTime, endTime,
                true, false
        );
        scheduleRepository.save(schedule);

        AttendanceCloseParam param = new AttendanceCloseParam(emp.getId(), date);
        attendanceClosing.closeAttendance(param);

        Attendance att = attendanceRepository.findByEmpIdAndAttendanceDate(emp.getId(), date)
                .stream().findFirst()
                .orElseThrow(() -> new AssertionError("근태가 저장되지 않았습니다."));

        assertThat(att.getStartAt()).isEqualTo(companyStartTime);
        assertThat(att.getEndAt()).isEqualTo(companyEndTime);
        assertThat(att.getAttendanceStatus()).isEqualTo(AttendanceStatus.ALL_DAY_LEAVE);
    }

//    취소된 출장/연가 → 무시됨
//    같은 날 출장 2건 / 출장+반차 조합

    @Test
    @DisplayName("취소된 부분일정 출장이라면, 일정에 반영치 않고 근태 계산을 한다.")
    void closeAttendance_With_Cancelled_BusinessTrip_PartOfDay_Schedule() {
        Emp emp = saveApprovedEmp(empRepository);
        LocalDate date = LocalDate.of(2026, 1, 1);

        LocalTime companyStartTime = companyPolicy.getStartTime();
        LocalTime companyEndTime = companyPolicy.getEndTime();
        LocalTime halfEndTime = companyEndTime.minusHours(companyPolicy.getWorkHours() / 2);

        saveAttendanceByClosing(emp, date, companyStartTime, halfEndTime);
        Schedule schedule = registerSchedule(
                "any", ScheduleType.BUSINESS_TRIP,
                emp, "취소된 출장", "내용",
                date, halfEndTime, companyEndTime,
                false, false
        );

        schedule.cancel();
        scheduleRepository.save(schedule);

        AttendanceCloseParam param = new AttendanceCloseParam(emp.getId(), date);
        attendanceClosing.closeAttendance(param);

        attendanceRepository.findByEmpIdAndAttendanceDate(emp.getId(), date)
                .stream().findFirst()
                .ifPresent(att -> {
                    assertThat(att.getAttendanceStatus()).isEqualTo(AttendanceStatus.LATE_EARLY);
                    assertThat(att.getStartAt()).isEqualTo(companyStartTime);
                    assertThat(att.getEndAt()).isEqualTo(halfEndTime);
                });
    }
    @Test
    @DisplayName("취소된 종일 출장이라면, 일정에 반영치 않고 근태 계산을 한다.")
    void closeAttendance_With_Cancelled_BusinessTrip_Schedule() {
        Emp emp = saveApprovedEmp(empRepository);
        LocalDate date = LocalDate.of(2026, 1, 1);

        LocalTime companyStartTime = companyPolicy.getStartTime();
        LocalTime companyEndTime = companyPolicy.getEndTime();

        Schedule schedule = registerSchedule(
                "any", ScheduleType.BUSINESS_TRIP,
                emp, "취소된 출장", "내용",
                date, companyStartTime, companyEndTime,
                true, false
        );

        schedule.cancel();
        scheduleRepository.save(schedule);

        AttendanceCloseParam param = new AttendanceCloseParam(emp.getId(), date);
        attendanceClosing.closeAttendance(param);

        attendanceRepository.findByEmpIdAndAttendanceDate(emp.getId(), date)
                .stream().findFirst()
                .ifPresent(att -> {
                    assertThat(att.getAttendanceStatus()).isEqualTo(AttendanceStatus.ABSENT);
                    assertThat(att.getStartAt()).isNull();
                    assertThat(att.getEndAt()).isNull();
                });

        assertThat(attendanceRepository.findByEmpIdAndAttendanceDate(emp.getId(), date)).hasSize(1);
    }

    @Test
    @DisplayName("취소된 반차라면, 일정에 반영치 않고 근태 계산을 한다.")
    void closeAttendance_With_Cancelled_Leave_partOfDay_Schedule() {
        Emp emp = saveApprovedEmp(empRepository);
        LocalDate date = LocalDate.of(2026, 1, 1);

        LocalTime companyStartTime = companyPolicy.getStartTime();
        LocalTime companyEndTime = companyPolicy.getEndTime();
        LocalTime halfEndTime = companyEndTime.minusHours(companyPolicy.getWorkHours() / 2);

        saveAttendanceByClosing(emp, date, companyStartTime, halfEndTime);
        Schedule schedule = registerSchedule(
                "any", ScheduleType.LEAVE,
                emp, "취소된 연차", "내용",
                date, halfEndTime, companyEndTime,
                false, false
        );

        schedule.cancel();
        scheduleRepository.save(schedule);

        AttendanceCloseParam param = new AttendanceCloseParam(emp.getId(), date);
        attendanceClosing.closeAttendance(param);


        attendanceRepository.findByEmpIdAndAttendanceDate(emp.getId(), date)
                .stream().findFirst()
                .ifPresent(att -> {
                    assertThat(att.getAttendanceStatus()).isEqualTo(AttendanceStatus.LATE_EARLY);
                    assertThat(att.getStartAt()).isEqualTo(companyStartTime);
                    assertThat(att.getEndAt()).isEqualTo(halfEndTime);
                });
        assertThat(attendanceRepository.findByEmpIdAndAttendanceDate(emp.getId(), date)).hasSize(1);
    }

    @Test
    @DisplayName("취소된 연차라면, 일정에 반영치 않고 근태 계산을 한다.")
    void closeAttendance_With_Cancelled_Leave_AllDay_Schedule() {
        Emp emp = saveApprovedEmp(empRepository);
        LocalDate date = LocalDate.of(2026, 1, 1);

        Schedule schedule = registerSchedule(
                "any", ScheduleType.LEAVE,
                emp, "취소된 연차", "내용",
                date, companyPolicy.getStartTime(), companyPolicy.getEndTime(),
                true, false
        );

        schedule.cancel();
        scheduleRepository.save(schedule);

        AttendanceCloseParam param = new AttendanceCloseParam(emp.getId(), date);
        attendanceClosing.closeAttendance(param);

        assertThat(attendanceRepository.findByEmpIdAndAttendanceDate(emp.getId(), date)).hasSize(1);

        attendanceRepository.findByEmpIdAndAttendanceDate(emp.getId(), date)
                .stream().findFirst()
                .ifPresent(att -> {
                    assertThat(att.getAttendanceStatus()).isEqualTo(AttendanceStatus.ABSENT);
        });
    }

    private void saveAttendanceByClosing(Emp emp, LocalDate date, @Nullable LocalTime startAt, @Nullable LocalTime endAt) {
        LocalDateTime start = startAt == null ? null : LocalDateTime.of(date, startAt);
        LocalDateTime end = endAt == null ? null : LocalDateTime.of(date, endAt);

        attendanceRecord.recordCheckIn(emp.getId(), start);

        if(end != null) attendanceRecord.recordCheckOut(emp.getId(), end);
    }

}