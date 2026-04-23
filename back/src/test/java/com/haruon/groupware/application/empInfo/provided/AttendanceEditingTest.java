package com.haruon.groupware.application.empInfo.provided;

import com.haruon.groupware.application.empInfo.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.attendanceService.AttendanceClosing;
import com.haruon.groupware.application.empInfo.attendanceService.dto.ApproveAttendanceByDeptManagerParam;
import com.haruon.groupware.application.empInfo.attendanceService.dto.AttendanceCloseParam;
import com.haruon.groupware.application.empInfo.attendanceService.dto.EditAttendanceByDeptManagerParam;
import com.haruon.groupware.application.empInfo.required.AttendanceRepository;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.application.utils.CompanyPolicyPort;
import com.haruon.groupware.domain.empInfo.Attendance;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.schedule.Schedule;
import com.haruon.groupware.domain.schedule.ScheduleType;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
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

import static com.haruon.groupware.application.empInfo.EmpFixtureWithDB.*;
import static com.haruon.groupware.domain.schedule.Schedule.registerSchedule;
import static java.time.LocalDateTime.of;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Slf4j
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestIntegrationConfig
record AttendanceEditingTest(
        AttendanceEditing attendanceEditing,
        AttendanceClosing attendanceClosing,
        AttendanceRecord attendanceRecord,
        AttendanceRepository attendanceRepository,
        ScheduleRepository scheduleRepository,
        EmpRepository empRepository,
        DeptRepository deptRepository,
        EntityManager entityManager,
        CompanyPolicyPort companyPolicy
) {

    @AfterEach
    void tearDown() {
        scheduleRepository.deleteAll();
        attendanceRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();

        entityManager.clear();
    }

    @Test
    @DisplayName("같은 부서의 부서매니저는 사원의 근태를 승인할 수 있다.")
    void approve_same_dept_attendance() {
        Dept dept = saveDept(deptRepository, "001", "HR");

        Emp targetEmp = saveEmpWithDept(
                empRepository, deptRepository, "202601001", "employee1", dept
        );

        Emp deptManager = saveEmpWithRoleAndDept(
                empRepository,
                deptRepository,
                "202601002", "employee2", dept,
                SystemRoleCode.DEPT_MANAGER
        );

        LocalDate attendanceDate = LocalDate.of(2026, 1, 1);
        Attendance attendance = saveClosedAttendance(targetEmp, attendanceDate, LocalTime.of(8, 0), LocalTime.of(17, 0));

        LocalDateTime approvedAt = of(2026, 1, 31, 9, 0, 0);

        log.info("===== 승인 쿼리 시작 =====");
        attendanceEditing.updateApproveAttendance(
                ApproveAttendanceByDeptManagerParam.builder()
                        .approverId(deptManager.getId())
                        .targetEmpId(targetEmp.getId())
                        .attendanceId(attendance.getId())
                        .approvedAt(approvedAt)
                        .build()
        );
        log.info("===== 승인 쿼리 종료 =====");

        attendanceRepository.findByEmpIdAndAttendanceDate(targetEmp.getId(), attendanceDate).stream().findFirst().ifPresent(att -> {
            assertThat(att.getApprovedBy()).isEqualTo(deptManager);
            assertThat(att.getApprovedAt()).isEqualTo(approvedAt);
        });
    }

    @Test
    @DisplayName("이미 승인된 근태는 수정할 수 없다.")
    void edit_already_approved_attendance_fail() {
        Dept dept = saveDept(deptRepository, "001", "HR");

        Emp targetEmp = saveEmpWithDept(
                empRepository, deptRepository, "202601001", "employee1", dept
        );

        Emp deptManager = saveEmpWithRoleAndDept(
                empRepository,
                deptRepository,
                "202601002", "employee2", dept,
                SystemRoleCode.DEPT_MANAGER
        );

        LocalDate attendanceDate = LocalDate.of(2026, 1, 1);
        Attendance attendance = saveClosedAttendance(targetEmp, attendanceDate, LocalTime.of(8, 0), LocalTime.of(17, 0));

        LocalDateTime approvedAt = of(2026, 1, 31, 9, 0, 0);

        attendanceEditing.updateApproveAttendance(
                ApproveAttendanceByDeptManagerParam.builder()
                        .approverId(deptManager.getId())
                        .targetEmpId(targetEmp.getId())
                        .attendanceId(attendance.getId())
                        .approvedAt(approvedAt)
                        .build()
        );

        assertThatThrownBy(() -> attendanceEditing.updateAttendanceByDeptManager(
                EditAttendanceByDeptManagerParam.builder()
                        .targetEmpId(targetEmp.getId())
                        .attendanceId(attendance.getId())
                        .startAt( companyPolicy.getStartTime())
                        .endAt( companyPolicy.getStartTime().plusHours(1))
                        .editedAt(LocalDateTime.of(2026,4,30,0,0,0))
                        .editReason("test")
                        .editorId(deptManager.getId())
                        .isIncludeHalfLeaveInDay(false)
                        .build()
        )).isInstanceOf(IllegalStateException.class);

    }

    @Test
    @DisplayName("근태 소유자와 targetEmpId 근태 승인 시 실패")
    void edit_other_emp_attendance_fail() {
        Dept dept = saveDept(deptRepository, "001", "HR");

        Emp attOwner = saveEmpWithDept(
                empRepository, deptRepository, "202601001", "employee1", dept
        );

        Emp unrelatedEmp = saveEmpWithDept(
                empRepository, deptRepository, "202601003", "employee3", dept
        );

        Emp deptManager = saveEmpWithRoleAndDept(
                empRepository,
                deptRepository,
                "202601002", "employee2", dept,
                SystemRoleCode.DEPT_MANAGER
        );

        LocalDate attendanceDate = LocalDate.of(2026, 1, 1);
        Attendance attendance = saveClosedAttendance(attOwner, attendanceDate, LocalTime.of(8, 0), LocalTime.of(17, 0));

        LocalDateTime approvedAt = of(2026, 1, 31, 9, 0, 0);

        assertThatThrownBy(() -> attendanceEditing.updateApproveAttendance(
                ApproveAttendanceByDeptManagerParam.builder()
                        .approverId(deptManager.getId())
                        .targetEmpId(unrelatedEmp.getId())
                        .attendanceId(attendance.getId())
                        .approvedAt(approvedAt)
                        .build()
        )).isInstanceOf(IllegalStateException.class);

    }

    @Test
    @DisplayName("근태 소유자와 targetEmpId 불일치하게 근태 수정시 실패")
    void approve_other_emp_attendance_fail() {
        Dept dept = saveDept(deptRepository, "001", "HR");

        Emp attOwner = saveEmpWithDept(
                empRepository, deptRepository, "202601001", "employee1", dept
        );

        Emp unrelatedEmp = saveEmpWithDept(
                empRepository, deptRepository, "202601003", "employee3", dept
        );

        Emp deptManager = saveEmpWithRoleAndDept(
                empRepository,
                deptRepository,
                "202601002", "employee2", dept,
                SystemRoleCode.DEPT_MANAGER
        );

        LocalDate attendanceDate = LocalDate.of(2026, 1, 1);
        Attendance attendance = saveClosedAttendance(attOwner, attendanceDate, LocalTime.of(8, 0), LocalTime.of(17, 0));

        LocalDateTime approvedAt = of(2026, 1, 31, 9, 0, 0);

        assertThatThrownBy(() -> attendanceEditing.updateAttendanceByDeptManager(
                EditAttendanceByDeptManagerParam.builder()
                        .targetEmpId(unrelatedEmp.getId())
                        .attendanceId(attendance.getId())
                        .startAt( companyPolicy.getStartTime())
                        .endAt( companyPolicy.getStartTime().plusHours(1))
                        .editedAt(LocalDateTime.of(2026,4,30,0,0,0))
                        .editReason("test")
                        .editorId(deptManager.getId())
                        .isIncludeHalfLeaveInDay(false)
                        .build()
        )).isInstanceOf(IllegalStateException.class);

    }

    @Test
    @DisplayName("부서매니저가 아닌 사용자는 근태를 승인할 수 없다")
    void approve_fail_not_manager() {
        Dept dept = saveDept(deptRepository, "001", "HR");

        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601001", "employee1", dept);

        Emp notManager = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601005", "employee5", dept, SystemRoleCode.EMPLOYEE
        );

        Attendance attendance = saveClosedAttendance(
                targetEmp, LocalDate.of(2026, 1, 1),
                LocalTime.of(8, 0), LocalTime.of(17, 0)
        );

        assertThatThrownBy(() ->
                attendanceEditing.updateApproveAttendance(
                        ApproveAttendanceByDeptManagerParam.builder()
                                .approverId(notManager.getId())
                                .targetEmpId(targetEmp.getId())
                                .attendanceId(attendance.getId())
                                .approvedAt(of(2026, 1, 31, 9, 0, 0))
                                .build()
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("비활성 부서매니저는 근태를 승인할 수 없다")
    void approve_fail_inactive_manager() {
        Dept dept = saveDept(deptRepository, "001", "HR");

        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601001", "employee1", dept);

        Emp inactiveManager = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601003", "employee3", dept, SystemRoleCode.DEPT_MANAGER
        );
        inactiveManager.changeResignedEmpInfoByAdmin(LocalDate.of(2026, 1, 20));

        empRepository.save(inactiveManager);
        Attendance attendance = saveClosedAttendance(
                targetEmp, LocalDate.of(2026, 1, 1),
                LocalTime.of(8, 0), LocalTime.of(17, 0)
        );

        assertThatThrownBy(() ->
                attendanceEditing.updateApproveAttendance(
                        ApproveAttendanceByDeptManagerParam.builder()
                                .approverId(inactiveManager.getId())
                                .targetEmpId(targetEmp.getId())
                                .attendanceId(attendance.getId())
                                .approvedAt(of(2026, 1, 31, 9, 0, 0))
                                .build()
                )
        ).isInstanceOf(IllegalArgumentException.class);

    }

    @Test
    @DisplayName("다른 부서의 부서매니저는 근태를 승인할 수 없다")
    void approve_fail_other_dept() {
        Dept dept = saveDept(deptRepository, "001", "HR");
        Dept otherDept = saveDept(deptRepository, "002", "IT");

        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601001", "employee1", dept);

        Emp otherDeptManager = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601004", "employee4", otherDept, SystemRoleCode.DEPT_MANAGER
        );

        Attendance attendance = saveClosedAttendance(
                targetEmp, LocalDate.of(2026, 1, 1),
                LocalTime.of(8, 0), LocalTime.of(17, 0)
        );

        assertThatThrownBy(() ->
                attendanceEditing.updateApproveAttendance(
                        ApproveAttendanceByDeptManagerParam.builder()
                                .approverId(otherDeptManager.getId())
                                .targetEmpId(targetEmp.getId())
                                .attendanceId(attendance.getId())
                                .approvedAt(of(2026, 1, 31, 9, 0, 0))
                                .build()
                )
        ).isInstanceOf(IllegalStateException.class);

    }

//    해피케이스
//    시간 변경 + 상태 null → 근무시간 기준으로 상태 재계산
//    시간 변경 + 상태 NORMAL → 근무시간 기준으로 재계산
//    시간 변경 + 상태 ABSENT → 근무시간 기준으로 재계산
//    시간 변경 + 상태 LATE_EARLY → 근무시간 기준으로 재계산
//    반차 포함 여부(isIncludeHalfLeaveInDay)에 따라 상태 계산이 달라지는지 확인

    private Stream<Arguments> updateAttendanceStatusArgumentsWithSubAttendance() {

        LocalTime companyStartTime = companyPolicy.getStartTime();
        LocalTime leaveStartAt = companyPolicy.getStartTime().plusHours(companyPolicy.getWorkHours() / 2);
        LocalTime leaveEndAt = companyPolicy.getEndTime();

        int requiredWorkMinutes =
                (companyPolicy.getWorkHours() - companyPolicy.getBreakHours()) * 60;
        long requiredHalfWorkMinutes = requiredWorkMinutes / 2;

        return Stream.of(
//                Arguments.of(
//                        "반차 포함 근태시간 변경 시, 필요 근로시간의 100%를 만족하면 정상근무",
//                        companyStartTime, companyStartTime.plusMinutes(requiredHalfWorkMinutes),
//                        leaveStartAt, leaveEndAt,
//                        AttendanceStatus.NORMAL
//                ),
//                Arguments.of(
//                        "반차 포함 근태시간 변경 시, 필요 근로시간의 50%이상 100%미만이면 지각 및 조퇴",
//                        companyStartTime, companyStartTime.plusMinutes(requiredHalfWorkMinutes / 2),
//                        leaveStartAt, leaveEndAt,
//                        AttendanceStatus.LATE_EARLY
//                ),
                Arguments.of(
                        "반차 포함 근태시간 변경 시, 필요 근로시간의 50%미만이면 결근",
                        companyStartTime, companyStartTime.plusMinutes((requiredHalfWorkMinutes / 2) - 1),
                        leaveStartAt, leaveEndAt,
                        AttendanceStatus.ABSENT
                )
        );
    }
    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("updateAttendanceStatusArgumentsWithSubAttendance")
    @DisplayName("반차 포함, 근태 수정 케이스")
    void updateAttendanceWithHalfLeave(
            String description,
            LocalTime empWorkStartTime,
            LocalTime empWorkEndTime,
            LocalTime leaveStartTime,
            LocalTime leaveEndTime,
            AttendanceStatus expectedStatus
    ) {
        LocalDate date = LocalDate.of(2026, 1, 1);

        Dept dept = saveDept(deptRepository, "001", "HR");
        Emp targetEmp = saveEmpWithDept(
                empRepository, deptRepository, "202601001", "employee1", dept
        );
        Emp deptManager = saveEmpWithRoleAndDept(
                empRepository,
                deptRepository,
                "202601002", "employee2", dept,
                SystemRoleCode.DEPT_MANAGER
        );

        Schedule schedule = registerSchedule(
                "any", ScheduleType.LEAVE,
                targetEmp, "반차", "내용",
                date, leaveStartTime, leaveEndTime,
                false, false
        );

        scheduleRepository.save(schedule);

        attendanceRecord.recordCheckIn(targetEmp.getId(), LocalDateTime.of(date, LocalTime.of(12,0,0)));
        attendanceRecord.recordCheckOut(targetEmp.getId(), LocalDateTime.of(date, LocalTime.of(13,0,0)));

        attendanceClosing.closeAttendance(new AttendanceCloseParam(targetEmp.getId(), date));

        List<Attendance> attendancesBeforeUpdate = attendanceRepository.findByEmpIdAndAttendanceDate(targetEmp.getId(), date);
        Attendance attendance = attendancesBeforeUpdate.stream()
                .filter(att -> att.getAttendanceStatus() == AttendanceStatus.ABSENT)
                .findFirst()
                .orElseThrow();

        log.info("========================= update 쿼리");
        attendanceEditing.updateAttendanceByDeptManager(
                EditAttendanceByDeptManagerParam.builder()
                        .targetEmpId(targetEmp.getId())
                        .attendanceId(attendance.getId())
                        .startAt(empWorkStartTime)
                        .endAt(empWorkEndTime)
                        .editedAt(of(2026,4,30,0,0,0))
                        .editReason("edit")
                        .editorId(deptManager.getId())
                        .isIncludeHalfLeaveInDay(true)
                        .build()
        );

        List<Attendance> attendances = attendanceRepository.findByEmpIdAndAttendanceDate(targetEmp.getId(), date);

        assertThat(attendances).hasSize(2);

        Attendance edited = attendances.stream()
                .filter(att -> att.getAttendanceStatus() == expectedStatus)
                .findFirst()
                .orElseThrow();

//        log.info("========================= edited.(), {}", edited.toString());
//        log.info("========================= edited.getStartAt(), {}", edited.getStartAt());
//        log.info("========================= edited.getEndAt(), {}", edited.getEndAt());

        assertThat(edited.getStartAt()).isEqualTo(empWorkStartTime);
        assertThat(edited.getEndAt()).isEqualTo(empWorkEndTime);
    }

    private Stream<Arguments> updateAttendanceTimeAndChangeStatusArguments() {

        LocalTime companyStartTime = companyPolicy.getStartTime();
        LocalTime companyEndTime = companyPolicy.getEndTime();
        int breakMinutes = companyPolicy.getBreakHours() * 60;
        int workMinutes = companyPolicy.getWorkHours()*60 - breakMinutes;

        LocalTime halfEndTime = companyStartTime.plusMinutes(workMinutes / 2);
        LocalTime lessThanHalfEndTime =companyStartTime.plusMinutes((workMinutes / 2) - 1);

        return Stream.of(
                Arguments.of("시간변경시, 소정근로시간 100%을 채우면 '정상근무'",
                        companyStartTime, companyEndTime,
                        AttendanceStatus.NORMAL
                ),
                Arguments.of("시간변경시, 소정근로시간 50%이상 100%미만 채우면 '지각 및 조퇴'",
                        companyStartTime, halfEndTime,
                        AttendanceStatus.LATE_EARLY
                ),
                Arguments.of("시간변경시, 소정근로시간 50%미만 채우면 '결근'",
                        companyStartTime, lessThanHalfEndTime,
                        AttendanceStatus.ABSENT
                )
        );
    }
    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("updateAttendanceTimeAndChangeStatusArguments")
    @DisplayName("근로변경시, 근태상태가 다시 갱신된다.")
    void update_attendance_times(String description, LocalTime startAt, LocalTime endAt, AttendanceStatus expectedStatus) {
        Dept dept = saveDept(deptRepository, "001", "HR");
        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601001", "employee1", dept);
        Emp deptManager = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601002", "employee2", dept, SystemRoleCode.DEPT_MANAGER
        );

        LocalDate attendanceDate = LocalDate.of(2026, 1, 1);
        Attendance attendance = saveClosedAttendance(targetEmp, attendanceDate, LocalTime.of(8, 0), LocalTime.of(17, 0));

        LocalDateTime editedAt = of(2026, 2, 1, 0, 0, 0);
        String reasonForEdit = "test";
        attendanceEditing.updateAttendanceByDeptManager(
                EditAttendanceByDeptManagerParam.builder()
                        .targetEmpId(targetEmp.getId())
                        .attendanceId(attendance.getId())
                        .startAt(startAt)
                        .endAt(endAt)
                        .editedAt(editedAt)
                        .editReason(reasonForEdit)
                        .editorId(deptManager.getId())
                        .isIncludeHalfLeaveInDay(false)
                        .build()
        );

        Attendance att = attendanceRepository.findByEmpIdAndAttendanceDate(targetEmp.getId(), attendanceDate)
                .stream()
                .findFirst()
                .orElseThrow();

        assertThat(att.getAttendanceStatus()).isEqualTo(expectedStatus);
        assertThat(att.getEditedBy()).isEqualTo(deptManager);
        assertThat(att.getEditedAt()).isEqualTo(editedAt);
        assertThat(att.getEditReason()).isEqualTo(reasonForEdit);
    }


    @Test
    @DisplayName("근로 시간 변경시, 출근시간만 변경할 수 있고, 근로시간에 따라 수정상태가 부적합하면 다시 상태를 계산한다")
    void update_attendance_times() {
        Dept dept = saveDept(deptRepository, "001", "HR");
        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601001", "employee1", dept);
        Emp deptManager = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601002", "employee2", dept, SystemRoleCode.DEPT_MANAGER
        );

        LocalDate attendanceDate = LocalDate.of(2026, 1, 1);
        Attendance attendance = saveClosedAttendance(targetEmp, attendanceDate, LocalTime.of(8, 0), LocalTime.of(17, 0));

        LocalTime editedStartAt = LocalTime.of(12, 0);

        log.info("===== 출근시간만 변경 =====");
        updateAttendance(
                targetEmp, attendance, editedStartAt, null, deptManager
        );

        Attendance att1 = attendanceRepository.findByEmpIdAndAttendanceDate(targetEmp.getId(), attendanceDate).stream().findFirst().orElseThrow();

        assertThat(att1.getStartAt()).isEqualTo(editedStartAt);
        assertThat(att1.getEndAt()).isEqualTo(attendance.getEndAt());
        assertThat(att1.getAttendanceStatus()).isEqualTo(AttendanceStatus.LATE_EARLY);

    }

    @Test
    @DisplayName("근로 시간 변경시, 퇴근 시간만 변경할 수 있고, 근로시간에 따른 수정상태가 부적합하면 다시 상태를 계산한다")
    void update_attendance_end_times() {
        Dept dept = saveDept(deptRepository, "001", "HR");
        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601001", "employee1", dept);
        Emp deptManager = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601002", "employee2", dept, SystemRoleCode.DEPT_MANAGER
        );

        LocalDate attendanceDate = LocalDate.of(2026, 1, 1);
        Attendance attendance = saveClosedAttendance(targetEmp, attendanceDate, LocalTime.of(8, 0), LocalTime.of(17, 0));

        LocalTime editedEndAt = LocalTime.of(22, 0);

        log.info("===== 퇴근시간만 변경 =====");
        updateAttendance(targetEmp, attendance, null, editedEndAt, deptManager);

        Attendance att2 = attendanceRepository.findByEmpIdAndAttendanceDate(targetEmp.getId(), attendanceDate)
                .stream()
                .findFirst()
                .orElseThrow();

        assertThat(att2.getStartAt()).isEqualTo(attendance.getStartAt());
        assertThat(att2.getEndAt()).isEqualTo(editedEndAt);
        assertThat(att2.getAttendanceStatus()).isEqualTo(AttendanceStatus.NORMAL);
    }

    @Test
    @DisplayName("근로변경시, 종료시간이 시작시간보다 이르면 변경에 실패한다.")
    void update_attendance_times_fail_cases() {
        Dept dept = saveDept(deptRepository, "001", "HR");
        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601001", "employee1", dept);
        Emp deptManager = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601002", "employee2", dept, SystemRoleCode.DEPT_MANAGER
        );

        LocalDate attendanceDate = LocalDate.of(2026, 1, 1);
        Attendance attendance = saveClosedAttendance(targetEmp, attendanceDate, LocalTime.of(8, 0), LocalTime.of(17, 0));

        assertThatThrownBy(() ->
                updateAttendance(
                        targetEmp
                        , attendance
                        , companyPolicy.getStartTime()
                        , companyPolicy.getStartTime().minusHours(1)
                        , deptManager
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("근로 수정 DTO 생성시, 시작시간, 종료시간 둘다 없으면 실패한다.")
    void update_attendance_without_editInfo_fail() {
        Dept dept = saveDept(deptRepository, "001", "HR");
        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601001", "employee1", dept);
        Emp deptManager = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601002", "employee2", dept, SystemRoleCode.DEPT_MANAGER
        );

        LocalDate attendanceDate = LocalDate.of(2026, 1, 1);
        Attendance attendance = saveClosedAttendance(targetEmp, attendanceDate, LocalTime.of(8, 0), LocalTime.of(17, 0));

        assertThatThrownBy(() ->
                updateAttendance(
                        targetEmp
                        , attendance
                        , null
                        , null
                        , deptManager
                )
        ).isInstanceOf(IllegalStateException.class);
    }


    @Test
    @DisplayName("부서매니저가 아닌 사용자는 근태를 수정할 수 없다")
    void edit_fail_not_manager() {
        Dept dept = saveDept(deptRepository, "001", "HR");

        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601001", "employee1", dept);

        Emp notManager = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601005", "employee5", dept, SystemRoleCode.EMPLOYEE
        );

        Attendance attendance = saveClosedAttendance(
                targetEmp, LocalDate.of(2026, 1, 1),
                LocalTime.of(8, 0), LocalTime.of(17, 0)
        );

        assertThatThrownBy(() ->
                updateAttendance(
                        targetEmp
                        , attendance
                        , companyPolicy.getStartTime()
                        , companyPolicy.getEndTime()
                        , notManager
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("비활성 부서매니저는 근태를 수정할 수 없다")
    void edit_fail_inactive_manager() {
        Dept dept = saveDept(deptRepository, "001", "HR");

        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601001", "employee1", dept);

        Emp inactiveManager = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601003", "employee3", dept, SystemRoleCode.DEPT_MANAGER
        );
        inactiveManager.changeResignedEmpInfoByAdmin(LocalDate.of(2026, 1, 20));

        empRepository.save(inactiveManager);
        Attendance attendance = saveClosedAttendance(
                targetEmp, LocalDate.of(2026, 1, 1),
                LocalTime.of(8, 0), LocalTime.of(17, 0)
        );

        assertThatThrownBy(() ->
                updateAttendance(
                        targetEmp
                        , attendance
                        , companyPolicy.getStartTime()
                        , companyPolicy.getEndTime()
                        , inactiveManager
                )
        ).isInstanceOf(IllegalArgumentException.class);

    }

    @Test
    @DisplayName("다른 부서의 부서매니저는 근태를 수정할 수 없다")
    void edit_fail_other_dept() {
        Dept dept = saveDept(deptRepository, "001", "HR");
        Dept otherDept = saveDept(deptRepository, "002", "IT");

        Emp targetEmp = saveEmpWithDept(empRepository, deptRepository, "202601001", "employee1", dept);

        Emp otherDeptManager = saveEmpWithRoleAndDept(
                empRepository, deptRepository, "202601004", "employee4", otherDept, SystemRoleCode.DEPT_MANAGER
        );

        Attendance attendance = saveClosedAttendance(
                targetEmp, LocalDate.of(2026, 1, 1),
                LocalTime.of(8, 0), LocalTime.of(17, 0)
        );

        assertThatThrownBy(() ->
                updateAttendance(
                        targetEmp
                        , attendance
                        , companyPolicy.getStartTime()
                        , companyPolicy.getEndTime()
                        , otherDeptManager
                )
        ).isInstanceOf(IllegalStateException.class);

    }

    private void updateAttendance(
            Emp targetEmp,
            Attendance attendance,
            @Nullable LocalTime editedStartAt,
            @Nullable LocalTime editedEndAt,
            Emp deptManager
    ) {
        attendanceEditing.updateAttendanceByDeptManager(
                EditAttendanceByDeptManagerParam.builder()
                        .targetEmpId(targetEmp.getId())
                        .attendanceId(attendance.getId())
                        .startAt(editedStartAt)
                        .endAt(editedEndAt)
                        .editedAt(of(2026, 2, 1, 0, 0, 0))
                        .editReason("test")
                        .editorId(deptManager.getId())
                        .isIncludeHalfLeaveInDay(false)
                        .build()
        );
    }




    private Attendance saveClosedAttendance(Emp targetEmp, LocalDate date, LocalTime workStartAt, LocalTime workEndAt) {

        attendanceRecord.recordCheckIn(targetEmp.getId(), of(date, workStartAt));
        attendanceRecord.recordCheckOut(targetEmp.getId(), of(date, workEndAt));
        AttendanceCloseParam attendanceCloseParam = new AttendanceCloseParam(targetEmp.getId(), date);

        attendanceClosing.closeAttendance(attendanceCloseParam);

        return attendanceRepository.findByEmpIdAndAttendanceDate(targetEmp.getId(), date).stream().findFirst().orElseThrow();
    }
}