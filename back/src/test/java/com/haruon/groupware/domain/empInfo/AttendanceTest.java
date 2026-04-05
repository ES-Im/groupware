package com.haruon.groupware.domain.empInfo;

import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;
import lombok.Builder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.stream.Stream;

import static com.haruon.groupware.domain.empInfo.Attendance.registerAttendanceByEmp;
import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
                        RegisterByEmpParam.builder()
                                .emp(null)
                                .startAt(checkIn)
                        .build()
                ),
                Arguments.of("출근시각(startAt)이 Null이면 근태를 등록할 수 없다",
                        RegisterByEmpParam.builder()
                                .emp(emp)
                                .startAt(null)
                        .build()
                )

        );
    }
    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("checkIn_ByEmp_Fail_Param")
    @DisplayName("출근기록 실패 케이스")
    void checkIn_ByEmp_Fail_Param(String description, RegisterByEmpParam registerByEmpParam) {
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
    private record RegisterByEmpParam(
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
    @Test
    @DisplayName("부서 시스템 담당자는 전날까지의 근태기록을 승인할 수 있다.")
    void approveAttendance_success() {
        Attendance attendance = getClosedAttendance();
        Emp approver = getApprovedEmp("20251201", "deptManger");
        LocalDate appDate = attendance.getAttendanceDate().plusDays(1);
        LocalTime appTime = LocalTime.of(0,0,0);
        LocalDateTime appDateTime = LocalDateTime.of(appDate, appTime);

        attendance.approveAttendance(
                approver,
                appDateTime
        );

        assertThat(attendance.getApprovedBy()).isEqualTo(approver);
        assertThat(attendance.getApprovedAt()).isEqualTo(appDateTime);
    }

    private static Stream<Arguments> approveFailParam() {
        Emp approver = getApprovedEmp("deptManger", "20251201");

        Attendance closedAttendance = getClosedAttendance();
        Attendance attendanceWithoutStatus = getCheckInAttendance();

        LocalTime approvedAt = LocalTime.of(0, 0, 0);

        LocalDateTime nextDay = LocalDateTime.of(
                closedAttendance.getAttendanceDate().plusDays(1),
                approvedAt);

        LocalDateTime sameDay = LocalDateTime.of(
                closedAttendance.getAttendanceDate(),
                approvedAt
        );

        Attendance approvedAttendance = getClosedAttendance();
        approvedAttendance.approveAttendance(approver, nextDay);

        return Stream.of(
                Arguments.of("근태상태가 Null이면 승인 할 수 없다.",
                        approveParam.builder()
                                .approver(approver)
                                .approvedAt(nextDay)
                                .build()
                        , attendanceWithoutStatus
                ),
                Arguments.of("근태일자와 같은 일자 혹은 그 이전 일자에 승인 할 수 없다.",
                        approveParam.builder()
                                .approver(approver)
                                .approvedAt(sameDay)
                                .build()
                        , closedAttendance
                ),
                Arguments.of("승인된거는 승인 할 수 없다.",
                        approveParam.builder()
                                .approver(approver)
                                .approvedAt(nextDay)
                                .build()
                        , approvedAttendance
                ),
                Arguments.of("승인자가 없다면 승인 할 수 없다.",
                        approveParam.builder()
                                .approver(null)
                                .approvedAt(nextDay)
                                .build()
                        , closedAttendance
                ),
                Arguments.of("승인 일시가 없다면 승인 못함", 
                        approveParam.builder()
                                .approver(approver)
                                .approvedAt(null)
                                .build()
                        , closedAttendance
                )
        );
    }
    @ParameterizedTest(name = "{index} ==> 근태 승인 시, {0}")
    @MethodSource("approveFailParam")
    @DisplayName("근태 승인 실패 케이스")
    void approveFail_Param(String description, approveParam failParams, Attendance attendance) {
        assertThatThrownBy(() ->
                attendance.approveAttendance(failParams.approver, failParams.approvedAt)
        ).isInstanceOf(Exception.class);
    }

    @Builder
    private record approveParam(
            Emp approver,
            LocalDateTime approvedAt
    ) {}

    private static Stream<Arguments> changeAttendanceLeaveStatusParam() {
        Attendance attendance = getClosedAttendance();
        LocalTime editStartAt = attendance.getStartAt();
        LocalTime editEndAt = attendance.getEndAt();

        LocalDateTime editedAt = LocalDateTime.of(2026, 4, 4, 0, 0, 0);
        String editReason = "test";
        Emp editor = getApprovedEmp("202604001", "deptManger");

        long requiredWorkHours = 9;

        return Stream.of(
                Arguments.of("연차로 상태를 변경할 때",
                        ChangeAttendanceParam.builder()
                                .startAt(editStartAt)
                                .endAt(editEndAt)
                                .status(AttendanceStatus.ALL_DAY_LEAVE)
                                .editor(editor)
                                .editReason(editReason)
                                .editedAt(editedAt)
                                .requiredWorkHours(requiredWorkHours)
                                .build()
                ),
                Arguments.of("병가로 상태를 변경할 때",
                        ChangeAttendanceParam.builder()
                                .startAt(editStartAt)
                                .endAt(editEndAt)
                                .status(AttendanceStatus.SICK_LEAVE)
                                .editor(editor)
                                .editReason(editReason)
                                .editedAt(editedAt)
                                .requiredWorkHours(requiredWorkHours)
                                .build()
                        )
        );
    }
    @ParameterizedTest(name = "{index} ==> {0}, 시작/종료시간은 Null이 된다.")
    @MethodSource("changeAttendanceLeaveStatusParam")
    @DisplayName("연차, 병가로 근태기록 변경 테스트")
    void change_Times_To_Null_When_LEAVE(String description, ChangeAttendanceParam param) {
        Attendance attendance = getClosedAttendance();

        attendance.changeAttendanceByDeptManager(
                param.startAt(),
                param.endAt(),
                param.status(),
                param.editedAt(),
                param.editReason(),
                param.editor()
        );

        assertThat(attendance.getStartAt()).isNull();
        assertThat(attendance.getEndAt()).isNull();
    }

    @Test
    @DisplayName("근태기록 변경 시, 변경자/변경시각/변경이유이 기록된다.")
    void change_Attendance_Record_Edit_Data() {
        Attendance attendance = getClosedAttendance();

        attendance.changeAttendanceByDeptManager(
                null, null, AttendanceStatus.SICK_LEAVE
                , LocalDateTime.of(2026, 12, 12, 0, 0, 0)
                , "testEdit"
                , getApprovedEmp()
        );

        assertThat(attendance.getEditedAt()).isNotNull();
        assertThat(attendance.getEditedBy()).isNotNull();
        assertThat(attendance.getEditReason()).isNotNull();
    }

    @Test
    @DisplayName("수정자 정보를 기록할 수 있다")
    void mark_editor_info() {
        Attendance attendance = getClosedAttendance();
        Emp editor = getApprovedEmp();
        LocalDateTime editedAt = LocalDateTime.of(2026, 4, 4, 10, 0);

        attendance.markEditor(editor, editedAt, "사유");

        assertThat(attendance.getEditedBy()).isEqualTo(editor);
        assertThat(attendance.getEditedAt()).isEqualTo(editedAt);
        assertThat(attendance.getEditReason()).isEqualTo("사유");
    }

    private static Stream<Arguments> changeAttendanceWithInvalidatedParam() {
        Attendance attendance = getClosedAttendance();
        LocalTime editStartAt = attendance.getStartAt().plusHours(1);
        LocalTime editEndAt = attendance.getEndAt().plusHours(1);

        LocalDateTime editedAt = LocalDateTime.of(2026, 4, 4, 0, 0, 0);
        String editReason = "test";
        Emp editor = getApprovedEmp("202604001", "deptManger");

        long requiredWorkHours = 9;

        return Stream.of(
                Arguments.of("수정일자는 NULL일 수 없다.",
                        ChangeAttendanceParam.builder()
                                .startAt(editStartAt)
                                .endAt(editEndAt)
                                .status(AttendanceStatus.NORMAL)
                                .editor(editor)
                                .editReason(editReason)
                                .editedAt(null)
                                .requiredWorkHours(requiredWorkHours)
                                .build()
                ), Arguments.of("수정자는 NULL일 수 없다",
                        ChangeAttendanceParam.builder()
                                .startAt(editStartAt)
                                .endAt(editEndAt)
                                .status(AttendanceStatus.NORMAL)
                                .editor(null)
                                .editReason(editReason)
                                .editedAt(editedAt)
                                .requiredWorkHours(requiredWorkHours)
                                .build()
                ), Arguments.of("수정사유는 NULL일 수 없다",
                        ChangeAttendanceParam.builder()
                                .startAt(editStartAt)
                                .endAt(editEndAt)
                                .status(AttendanceStatus.NORMAL)
                                .editor(editor)
                                .editReason(null)
                                .editedAt(editedAt)
                                .requiredWorkHours(requiredWorkHours)
                                .build()
                ),Arguments.of("수정사유는 빈 값일 수 없다",
                        ChangeAttendanceParam.builder()
                                .startAt(editStartAt)
                                .endAt(editEndAt)
                                .status(AttendanceStatus.NORMAL)
                                .editor(editor)
                                .editReason("")
                                .editedAt(editedAt)
                                .requiredWorkHours(requiredWorkHours)
                                .build()
                ), Arguments.of("필요 근무시간은 하루(24시간) 이하여야한다.",
                        ChangeAttendanceParam.builder()
                                .startAt(editStartAt)
                                .endAt(editEndAt)
                                .status(AttendanceStatus.NORMAL)
                                .editor(editor)
                                .editReason("")
                                .editedAt(editedAt)
                                .requiredWorkHours(25)
                                .build()
                ), Arguments.of("필요 근무시간은 양수여야한다.",
                        ChangeAttendanceParam.builder()
                                .startAt(editStartAt)
                                .endAt(editEndAt)
                                .status(AttendanceStatus.NORMAL)
                                .editor(editor)
                                .editReason("")
                                .editedAt(editedAt)
                                .requiredWorkHours(-1)
                                .build()
                ), Arguments.of("종료시간이 시작시간보다 빠르면 안된다.",
                        ChangeAttendanceParam.builder()
                                .startAt(editStartAt.plusHours(10))
                                .endAt(editEndAt.minusHours(10))
                                .status(AttendanceStatus.NORMAL)
                                .editor(editor)
                                .editReason("")
                                .editedAt(editedAt)
                                .requiredWorkHours(requiredWorkHours)
                                .build()
                )
        );
    }
    @ParameterizedTest(name = "{index} ==> 근태 변경 시, {0}")
    @MethodSource("changeAttendanceWithInvalidatedParam")
    @DisplayName("근태 변경 각 인자별 실패 케이스")
    void change_attendance_with_Invalidated_param(String description, ChangeAttendanceParam param) {
        Attendance attendance = getClosedAttendance();

        assertThatThrownBy(() ->
                    attendance.changeAttendanceByDeptManager(
                            param.startAt(),
                            param.endAt(),
                            param.status(),
                            param.editedAt(),
                            param.editReason(),
                            param.editor()
                    )
        ).isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("이미 승인된 근태는 수정할 수 없다.")
    void cant_change_attendance_when_approved() {
        Emp deptManager = getApprovedEmp();
        Attendance approvedAttendance = getApprovedAttendance();

        assertThatThrownBy(() ->
            approvedAttendance.changeAttendanceByDeptManager(
                    null, null, AttendanceStatus.SICK_LEAVE
                    , LocalDateTime.of(2026, 12, 12, 0, 0, 0)
                    , "testEdit"
                    , deptManager
            )
        ).isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("시각 또는 종료 시간이 Null이면 정상근무/지각및조퇴/결근 상태 변경을 할 수 없다.")
    void cannot_change_to_normal_when_start_or_end_time_is_null() {
        Emp deptManager = getApprovedEmp();

        assertThatThrownBy(() ->
            getSickLeaveAttendance().changeAttendanceByDeptManager(
                    null, LocalTime.of(20,0,0), AttendanceStatus.NORMAL
                    , LocalDateTime.of(2026, 12, 12, 1, 0, 0)
                    , "testEdit"
                    , deptManager
            )
        ).isInstanceOf(Exception.class);

        assertThatThrownBy(() ->
            getSickLeaveAttendance().changeAttendanceByDeptManager(
                    LocalTime.of(8,0,0), null, AttendanceStatus.NORMAL
                    , LocalDateTime.of(2026, 12, 12, 1, 0, 0)
                    , "testEdit"
                    , deptManager
            )
        ).isInstanceOf(Exception.class);

        assertThatThrownBy(() ->
            getSickLeaveAttendance().changeAttendanceByDeptManager(
                    null, null, AttendanceStatus.NORMAL
                    , LocalDateTime.of(2026, 12, 12, 1, 0, 0)
                    , "testEdit"
                    , deptManager
            )
        ).isInstanceOf(Exception.class);
    }

    @Builder
    private record ChangeAttendanceParam(
            LocalTime startAt,
            LocalTime endAt,
            AttendanceStatus status,
            LocalDateTime editedAt,
            String editReason,
            Emp editor,
            long requiredWorkHours
    ) {}

    @Test
    @DisplayName("근태 시간 변경 테스트 - 마감시 사용")
    void change_attendance_time_success() {
        Attendance attendance = getClosedAttendance();

        LocalTime editStartedAt = LocalTime.of(7,0,0);
        LocalTime editEndAt = LocalTime.of(20,0,0);

        Attendance.changeAttendanceTime(attendance, editStartedAt, editEndAt);
    }

    @Test
    @DisplayName("근태 시간 변경 실패 테스트 - 시작시간은 종료시간보다 늦을 수 없다.")
    void change_attendance_time_fail() {
        Attendance attendance = getClosedAttendance();

        LocalTime editStartedAt = LocalTime.of(7,0,0);
        LocalTime editEndAt = LocalTime.of(5,0,0);

        assertThatThrownBy(() ->
                Attendance.changeAttendanceTime(attendance, editStartedAt, editEndAt)
        ).isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("근태 상태 변경 테스트 - 마감시 사용")
    void change_attendance_status_success() {
        Attendance attendance = getClosedAttendance();
        AttendanceStatus editedStatus = AttendanceStatus.ABSENT;

        Attendance.changeAttendanceStatus(attendance, editedStatus);

        assertThat(attendance.getAttendanceStatus()).isEqualTo(editedStatus);
    }

    @Test
    @DisplayName("근태 상태 변경 테스트 - 마감시 사용")
    void change_attendance_status_fail() {
        Attendance attendance = getClosedAttendance();

        assertThatThrownBy(() ->
                Attendance.changeAttendanceStatus(attendance, null)
        ).isInstanceOf(Exception.class);
    }
    // 근태 마감용 메서드 테스트 registerAttendance registerAttendance

    private static Stream<Arguments> registerAttendanceFailParam() {
        Emp emp = getApprovedEmp();
        LocalDate date = LocalDate.of(2026, 3, 1);
        AttendanceStatus status = AttendanceStatus.NORMAL;

        return Stream.of(
                Arguments.of("근태대상 사원 정보",
                        RegisterAttendanceParam.builder()
                                .emp(null)
                                .date(date)
                                .status(status)
                                .startAt(null)
                                .endAt(null)
                        .build()
                ),Arguments.of("근태대상 일자 정보",
                        RegisterAttendanceParam.builder()
                                .emp(emp)
                                .date(null)
                                .status(status)
                                .startAt(null)
                                .endAt(null)
                        .build()
                ),Arguments.of("근태대상 사원 정보",
                        RegisterAttendanceParam.builder()
                                .emp(emp)
                                .date(date)
                                .status(null)
                                .startAt(null)
                                .endAt(null)
                        .build()
                )
        );
    }
    @ParameterizedTest(name = "{index} ==> 근태 마감 시, {0} 값이 없다면 등록이 되지 않는다.")
    @MethodSource("registerAttendanceFailParam")
    @DisplayName("근태 마감 테스트 - 사원/대상일자/근태상태는 필수 값이다.")
    void registerAttendance_fail(String description, RegisterAttendanceParam params) {
        Attendance attendance = getClosedAttendance();

        assertThatThrownBy(() ->
            attendance.changeAttendanceByDeptManager(
                    params.startAt(),
                    params.endAt(),
                    params.status(),
                    LocalDateTime.of(2026,4,4,0,0,0),
                    "test",
                    getApprovedEmp()
            )
        ).isInstanceOf(Exception.class);
    }

    @Builder
    private record RegisterAttendanceParam(
            Emp emp,
            LocalDate date,
            AttendanceStatus status,
            LocalTime startAt,
            LocalTime endAt
    ) {}


    private static Attendance getClosedAttendance() {
        Attendance attendance = getCheckInAttendance();

        LocalDate attDate = attendance.getAttendanceDate();
        LocalTime endAt = attendance.getStartAt().plusHours(9);
        LocalDateTime endDateAt = LocalDateTime.of(attDate, endAt);
        attendance.recordEndAtByEmp(
                endDateAt
        );

        return Attendance.registerAttendance(
                attendance.getEmp(),
                attDate,
                AttendanceStatus.NORMAL,
                attendance.getStartAt(),
                attendance.getEndAt()
        );
    }

    private static Attendance getApprovedAttendance() {
        Attendance attendance = getClosedAttendance();
        Emp approver = getApprovedEmp("20251201", "deptManger");
        LocalDate appDate = attendance.getAttendanceDate().plusDays(1);
        LocalTime appTime = LocalTime.of(0,0,0);
        LocalDateTime appDateTime = LocalDateTime.of(appDate, appTime);

        attendance.approveAttendance(
                approver,
                appDateTime
        );

        return attendance;
    }

    private static Attendance getSickLeaveAttendance() {
        Emp deptManager = getApprovedEmp();
        Attendance closedAttendance = getClosedAttendance();
        closedAttendance.changeAttendanceByDeptManager(
                null, null, AttendanceStatus.SICK_LEAVE
                , LocalDateTime.of(2026, 12, 12, 0, 0, 0)
                , "testEdit"
                , deptManager
        );

        return closedAttendance;
    }

}