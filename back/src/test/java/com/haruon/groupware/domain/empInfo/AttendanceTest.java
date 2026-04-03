package com.haruon.groupware.domain.empInfo;

import lombok.Builder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.Temporal;
import java.time.temporal.TemporalField;
import java.util.stream.Stream;

import static com.haruon.groupware.domain.empInfo.Attendance.registerAttendanceByEmp;
import static com.haruon.groupware.domain.shared.EmpFixture.*;
import static org.assertj.core.api.Assertions.*;
import static org.assertj.core.api.Assertions.assertThat;

class AttendanceTest {

    @Test
    @DisplayName("본인 출근 기록 시, 근태 엔터티가 생성된다.")
    void checkIn_Attendance_ByEmp() {
        Emp emp = getApprovedEmp();
        LocalDateTime checkIn = LocalDateTime.of(2026, 1, 1, 9, 0, 0);

        Attendance attendance = registerAttendanceByEmp(emp, checkIn);

        assertThat(attendance.getEmp()).isEqualTo(emp);
        assertThat(attendance.getAttendanceDate()).isEqualTo(checkIn.toLocalDate());
        assertThat(attendance.getStartAt()).isEqualTo(checkIn.toLocalTime());

        assertThat(attendance.getAttendanceStatus()).isNull();
        assertThat(attendance.getEndAt()).isNull();
        assertThat(attendance.getApprovedAt()).isNull();
        assertThat(attendance.getApprovedBy()).isNull();
        assertThat(attendance.getEditedBy()).isNull();
        assertThat(attendance.getEditedAt()).isNull();
        assertThat(attendance.getEditReason()).isNull();
    }

    private static Stream<Arguments> checkIn_ByEmp_Fail_Param() {
        Emp emp = getApprovedEmp();
        LocalDateTime checkIn = LocalDateTime.of(2026, 1, 1, 9, 0, 0);

        return Stream.of(
                Arguments.of("사원정보(emp) Null이면 근태를 등록할 수 없다",
                        registerByEmpParam.builder()
                                .emp(null)
                                .startAt(checkIn)
                        .build()
                ),
                Arguments.of("출근시각(startAt)이 Null이면 근태를 등록할 수 없다",
                        registerByEmpParam.builder()
                                .emp(emp)
                                .startAt(null)
                        .build()
                )

        );
    }
    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("checkIn_ByEmp_Fail_Param")
    @DisplayName("출근기록 실패 케이스")
    void checkIn_ByEmp_Fail_Param(String description, registerByEmpParam registerByEmpParam) {
        assertThatThrownBy(() ->
                registerAttendanceByEmp(registerByEmpParam.emp(), registerByEmpParam.startAt())
        ).isInstanceOf(NullPointerException.class);
    }

    // 퇴근기록 성공 케이스
    @Test
    @DisplayName("본인 퇴근 기록시, 근태 엔터티가 수정된다.")
    void checkoutAttendance_ByEmp() {
        Attendance attendance = getCheckInAttendance();
        LocalDate attendanceDate = attendance.getAttendanceDate();
        LocalDateTime checkOut = LocalDateTime.of(
                attendanceDate.getYear(),
                attendanceDate.getMonth(), attendanceDate.getDayOfMonth(),
                18,
                0,
                0
        );

        var result = attendance.recordEndAtByEmp(checkOut);

        assertThat(result).isOne();
        assertThat(attendance.getEmp()).isNotNull();
        assertThat(attendance.getAttendanceDate()).isEqualTo(checkOut.toLocalDate());
        assertThat(attendance.getStartAt()).isNotNull();
        assertThat(attendance.getEndAt()).isEqualTo(checkOut.toLocalTime());

        assertThat(attendance.getAttendanceStatus()).isNull();
        assertThat(attendance.getApprovedAt()).isNull();
        assertThat(attendance.getApprovedBy()).isNull();
        assertThat(attendance.getEditedBy()).isNull();
        assertThat(attendance.getEditedAt()).isNull();
        assertThat(attendance.getEditReason()).isNull();
    }
    // 퇴근기록 실패 케이스

    private static Stream<Arguments> checkout_ByEmp_Fail_Param() {
        Attendance attendance = getCheckInAttendance();
        LocalDate attendanceDate = attendance.getAttendanceDate();
        LocalTime startAt = attendance.getStartAt();

        return Stream.of(
                Arguments.of("퇴근시간이 없다면 퇴근을 기록할 수 없다.",
                        null
                ),
                Arguments.of("다른일자의 근태기록에 퇴근을 기록할 수 없다.",
                        LocalDateTime.of(
                                attendanceDate.getYear(),
                                attendanceDate.getMonth(),
                                attendanceDate.minusDays(1).getDayOfMonth(),
                                18, 0, 0
                        )
                ),
                Arguments.of("퇴근시간은 출근시각보다 빠를 수 없다.",
                        LocalDateTime.of(
                                attendanceDate.getYear(),
                                attendanceDate.getMonth(),
                                attendanceDate.getDayOfMonth(),
                                startAt.minusHours(1).getHour(), 0, 0
                        )
                )

        );
    }
    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("checkout_ByEmp_Fail_Param")
    @DisplayName("퇴근기록 실패 케이스")
    void checkout_ByEmp_Fail_Param(String description, LocalDateTime endAt) {
        Attendance attendance = getCheckInAttendance();

        assertThatThrownBy(() ->
                attendance.recordEndAtByEmp(endAt)
        ).isInstanceOf(IllegalStateException.class);
    }

    @Builder
    private record registerByEmpParam(
        Emp emp,
        LocalDateTime startAt,
        LocalDateTime endAt
    ) {}
    private static Attendance getCheckInAttendance() {
        Emp emp = getApprovedEmp();
        LocalDateTime checkIn = LocalDateTime.of(2026, 1, 1, 9, 0, 0);

        return registerAttendanceByEmp(emp, checkIn);
    }

    // 부서매니저 승인테스트

    // 근태 수정 테스트 (changeAttTime, markEditor, changeAttByDeptManager)

    // 근태 마감용 메서드 테스트


}