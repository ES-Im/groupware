package com.haruon.groupware.adapter.webapi.employee.attendance;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.application.employee.attendance.required.AttendanceRepository;
import com.haruon.groupware.domain.employee.Attendance;
import com.haruon.groupware.domain.employee.Emp;
import com.haruon.groupware.domain.employee.enums.AttendanceStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static com.haruon.groupware.application.utils.Utils.SEOUL_ZONE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class MyAttendanceApiTest extends IntegrationTestSupport {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @AfterEach
    void tearDownAttendance() {
        attendanceRepository.deleteAll();
        entityManager.clear();
    }

    @Test
    @DisplayName("내 월별 근태 조회 - 상태 필터를 적용해 본인 근태만 조회한다")
    void myAttendanceRecord_success() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        activatedEmp(loginId, password);
        Emp emp = empRepository.findByLoginId(loginId).orElseThrow();

        String otherLoginId = "login12346";
        activatedEmp(otherLoginId, password);
        Emp otherEmp = empRepository.findByLoginId(otherLoginId).orElseThrow();

        Attendance mine = saveAttendance(emp, LocalDate.of(2026, 4, 1), AttendanceStatus.NORMAL, LocalTime.of(9, 0), LocalTime.of(18, 0));
        saveAttendance(emp, LocalDate.of(2026, 4, 2), AttendanceStatus.LATE_EARLY, LocalTime.of(10, 0), LocalTime.of(15, 0));
        saveAttendance(otherEmp, LocalDate.of(2026, 4, 1), AttendanceStatus.NORMAL, LocalTime.of(9, 0), LocalTime.of(18, 0));

        String accessToken = loginByIdAndPw(loginId, password);

        mockMvc.perform(
                        get("/api/employees/attendances/me/monthly")
                                .header("Authorization", BEARER + accessToken)
                                .param("yearMonth", "2026-04")
                                .param("status", "NORMAL")
                                .param("page", "0")
                                .param("size", "10")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].attendanceId").value(mine.getId()))
                .andExpect(jsonPath("$.content[0].attendanceStatus").value("NORMAL"))
                .andExpect(jsonPath("$.content[0].attendanceDate").value("2026-04-01"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("내 월별 근태 요약 조회")
    void myAttendanceSummary_success() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        activatedEmp(loginId, password);
        Emp emp = empRepository.findByLoginId(loginId).orElseThrow();

        Attendance approved = Attendance.registerAttendance(
                emp,
                LocalDate.of(2026, 4, 1),
                AttendanceStatus.NORMAL,
                LocalTime.of(9, 0),
                LocalTime.of(19, 0)
        );
        approved.approveAttendance(emp, LocalDateTime.of(2026, 4, 30, 9, 0));
        attendanceRepository.save(approved);

        saveAttendance(emp, LocalDate.of(2026, 4, 2), AttendanceStatus.LATE_EARLY, LocalTime.of(10, 0), LocalTime.of(15, 0));
        saveAttendance(emp, LocalDate.of(2026, 5, 1), AttendanceStatus.NORMAL, LocalTime.of(9, 0), LocalTime.of(18, 0));

        String accessToken = loginByIdAndPw(loginId, password);

        mockMvc.perform(
                        get("/api/employees/attendances/me/monthly/summary")
                                .header("Authorization", BEARER + accessToken)
                                .param("yearMonth", "2026-04")
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.approvedAttendanceCount").value(1))
                .andExpect(jsonPath("$.pendingAttendanceCount").value(1))
                .andExpect(jsonPath("$.totalAttendanceCount").value(2))
                .andExpect(jsonPath("$.overtimeMinutes").value(180));
    }

    @Test
    @DisplayName("출근/퇴근 기록")
    void checkIn_and_checkOut_success() throws Exception {
        String loginId = "login12345";
        String password = "!Q2w3e4r5t";
        activatedEmp(loginId, password);
        Emp emp = empRepository.findByLoginId(loginId).orElseThrow();

        String accessToken = loginByIdAndPw(loginId, password);
        LocalDate attendanceDate = LocalDate.now(SEOUL_ZONE);

        mockMvc.perform(
                        post("/api/employees/attendances/me/check-in")
                                .header("Authorization", BEARER + accessToken)
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        Attendance checkIn = attendanceRepository
                .findByEmpIdAndAttendanceDate(emp.getId(), attendanceDate)
                .stream()
                .findFirst()
                .orElseThrow();

        assertThat(checkIn.getStartAt()).isNotNull();
        assertThat(checkIn.getEndAt()).isNull();
        assertThat(checkIn.getAttendanceStatus()).isNull();

        mockMvc.perform(
                        patch("/api/employees/attendances/me/check-out")
                                .header("Authorization", BEARER + accessToken)
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());

        Attendance checkOut = attendanceRepository
                .findByEmpIdAndAttendanceDate(emp.getId(), attendanceDate)
                .stream()
                .findFirst()
                .orElseThrow();

        assertThat(checkOut.getStartAt()).isNotNull();
        assertThat(checkOut.getEndAt()).isNotNull();
        assertThat(checkOut.getEndAt()).isAfterOrEqualTo(checkOut.getStartAt());
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
}
