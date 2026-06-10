package com.haruon.groupware.adapter.webapi.emp.attendance;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.application.empInfo.attendance.required.AttendanceRepository;
import com.haruon.groupware.application.empInfo.attendance.service.dto.request.EditAttendanceByDeptManagerRequest;
import com.haruon.groupware.domain.empInfo.Attendance;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class AttendanceManagementApiTest extends IntegrationTestSupport {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @AfterEach
    void tearDownAttendance() {
        attendanceRepository.deleteAll();
        entityManager.clear();
    }

    @Test
    @DisplayName("부서 월별 근태 조회 - 부서 매니저는 같은 부서 사원의 근태를 조회할 수 있다")
    void deptAttendances_success() throws Exception {
        AttendanceFixture fixture = prepareDeptAttendanceFixture();
        saveAttendance(fixture.targetEmp(), LocalDate.of(2026, 4, 1), AttendanceStatus.NORMAL, LocalTime.of(9, 0), LocalTime.of(18, 0));
        saveAttendance(fixture.targetEmp(), LocalDate.of(2026, 4, 2), AttendanceStatus.LATE_EARLY, LocalTime.of(10, 0), LocalTime.of(15, 0));

        mockMvc.perform(
                        get("/api/employees/attendances/{deptId}/monthly", fixture.dept().getId())
                                .header("Authorization", BEARER + fixture.managerAccessToken())
                                .param("yearMonth", "2026-04")
                                .param("keyword", "Test")
                                .param("status", "NORMAL")
                                .param("page", "0")
                                .param("size", "10")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].empInfo.empId").value(fixture.targetEmp().getId()))
                .andExpect(jsonPath("$.content[0].empInfo.deptName").value("IT"))
                .andExpect(jsonPath("$.content[0].summary.totalAttendanceCount").value(1))
                .andExpect(jsonPath("$.content[0].attendanceInfo[0].attendanceStatus").value("NORMAL"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("부서 승인 대기 근태 조회")
    void deptApprovePendingAttendances_success() throws Exception {
        AttendanceFixture fixture = prepareDeptAttendanceFixture();
        Attendance approved = Attendance.registerAttendance(
                fixture.targetEmp(),
                LocalDate.of(2026, 4, 1),
                AttendanceStatus.NORMAL,
                LocalTime.of(9, 0),
                LocalTime.of(18, 0)
        );
        approved.approveAttendance(fixture.managerEmp(), LocalDateTime.of(2026, 4, 30, 9, 0));
        attendanceRepository.save(approved);

        saveAttendance(fixture.targetEmp(), LocalDate.of(2026, 4, 2), AttendanceStatus.LATE_EARLY, LocalTime.of(10, 0), LocalTime.of(15, 0));

        mockMvc.perform(
                        get("/api/employees/attendances/{deptId}/monthly/pending", fixture.dept().getId())
                                .header("Authorization", BEARER + fixture.managerAccessToken())
                                .param("page", "0")
                                .param("size", "10")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].empInfo.empId").value(fixture.targetEmp().getId()))
                .andExpect(jsonPath("$.content[0].attendanceInfo.attendanceStatus").value("LATE_EARLY"))
                .andExpect(jsonPath("$.content[0].attendanceInfo.isApproved").value(false))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("부서 매니저 근태 수정")
    void updateAttendance_success() throws Exception {
        AttendanceFixture fixture = prepareDeptAttendanceFixture();
        Attendance attendance = saveAttendance(
                fixture.targetEmp(),
                LocalDate.of(2026, 4, 1),
                AttendanceStatus.NORMAL,
                LocalTime.of(9, 0),
                LocalTime.of(18, 0)
        );

        LocalDateTime editedAt = LocalDateTime.of(2026, 4, 30, 9, 0);
        EditAttendanceByDeptManagerRequest request = EditAttendanceByDeptManagerRequest.builder()
                .targetEmpId(fixture.targetEmp().getId())
                .startAt(LocalTime.of(12, 0))
                .endAt(LocalTime.of(17, 0))
                .editedAt(editedAt)
                .editReason("출퇴근 기록 보정")
                .build();

        mockMvc.perform(
                        patch("/api/employees/attendances/{attendanceId}", attendance.getId())
                                .header("Authorization", BEARER + fixture.managerAccessToken())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsBytes(request))
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        Attendance updated = findAttendance(fixture.targetEmp(), LocalDate.of(2026, 4, 1));

        assertThat(updated.getStartAt()).isEqualTo(LocalTime.of(12, 0));
        assertThat(updated.getEndAt()).isEqualTo(LocalTime.of(17, 0));
        assertThat(updated.getAttendanceStatus()).isEqualTo(AttendanceStatus.LATE_EARLY);
        assertThat(updated.getEditedBy()).isEqualTo(fixture.managerEmp());
        assertThat(updated.getEditedAt()).isEqualTo(editedAt);
        assertThat(updated.getEditReason()).isEqualTo("출퇴근 기록 보정");
    }

    @Test
    @DisplayName("부서 매니저 근태 승인")
    void approveAttendance_success() throws Exception {
        AttendanceFixture fixture = prepareDeptAttendanceFixture();
        Attendance attendance = saveAttendance(
                fixture.targetEmp(),
                LocalDate.of(2026, 4, 1),
                AttendanceStatus.NORMAL,
                LocalTime.of(9, 0),
                LocalTime.of(18, 0)
        );

        LocalDateTime approvedAt = LocalDateTime.of(2026, 4, 30, 9, 0);

        mockMvc.perform(
                        patch("/api/employees/attendances/{attendanceId}/approval", attendance.getId())
                                .header("Authorization", BEARER + fixture.managerAccessToken())
                                .param("targetEmpId", fixture.targetEmp().getId().toString())
                                .param("approvedAt", "2026-04-30T09:00:00")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        Attendance approved = findAttendance(fixture.targetEmp(), LocalDate.of(2026, 4, 1));

        assertThat(approved.getApprovedBy()).isEqualTo(fixture.managerEmp());
        assertThat(approved.getApprovedAt()).isEqualTo(approvedAt);
    }

    private AttendanceFixture prepareDeptAttendanceFixture() throws Exception {
        String password = "!Q2w3e4r5t";
        Dept dept = getDept("002", "IT");

        String managerLoginId = "manager12345";
        registerDeptManager(managerLoginId, password, dept);
        Emp managerEmp = empRepository.findByLoginId(managerLoginId).orElseThrow();
        String managerAccessToken = loginByIdAndPw(managerLoginId, password);

        String targetLoginId = "employee12345";
        registerEmpHavingAllInfo(targetLoginId, password);
        Emp targetEmp = empRepository.findByLoginId(targetLoginId).orElseThrow();

        return new AttendanceFixture(dept, managerEmp, targetEmp, managerAccessToken);
    }

    private Attendance saveAttendance(
            Emp emp,
            LocalDate attendanceDate,
            AttendanceStatus attendanceStatus,
            LocalTime startAt,
            LocalTime endAt
    ) {
        return attendanceRepository.save(
                Attendance.registerAttendance(
                        emp,
                        attendanceDate,
                        attendanceStatus,
                        startAt,
                        endAt
                )
        );
    }

    private Attendance findAttendance(Emp emp, LocalDate attendanceDate) {
        return attendanceRepository
                .findByEmpIdAndAttendanceDate(emp.getId(), attendanceDate)
                .stream()
                .findFirst()
                .orElseThrow();
    }

    private record AttendanceFixture(
            Dept dept,
            Emp managerEmp,
            Emp targetEmp,
            String managerAccessToken
    ) {
    }
}
