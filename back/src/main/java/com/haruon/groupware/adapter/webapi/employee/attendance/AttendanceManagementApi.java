package com.haruon.groupware.adapter.webapi.employee.attendance;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.employee.attendance.provided.forCommand.AttendanceEditing;
import com.haruon.groupware.application.employee.attendance.provided.forRetriever.AttendanceRetriever;
import com.haruon.groupware.application.employee.attendance.service.command.dto.ApproveAttendanceByDeptManagerRequest;
import com.haruon.groupware.application.employee.attendance.service.command.dto.EditAttendanceByDeptManagerRequest;
import com.haruon.groupware.application.employee.attendance.service.query.dto.result.DeptAttendanceResponse;
import com.haruon.groupware.application.employee.attendance.service.query.dto.result.DeptPendingAttendanceResponse;
import com.haruon.groupware.domain.employee.enums.AttendanceStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.YearMonth;

import static com.haruon.groupware.application.utils.Utils.ZONE_SEOUL;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/employees/attendances")
public class AttendanceManagementApi {

    private final AttendanceRetriever attendanceRetriever;
    private final AttendanceEditing attendanceEditing;

    @GetMapping("/{deptId}/monthly")
    public ResponseEntity<Page<DeptAttendanceResponse>> deptAttendances (
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long deptId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth yearMonth,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) AttendanceStatus status,
            @PageableDefault(page = 0, size = 10) Pageable pageable
    ) {
        YearMonth targetYM = getYearMonth(yearMonth);

        Page<DeptAttendanceResponse> response = attendanceRetriever.retrieverDeptAttendanceMonthly(
                details.getEmpId(), deptId, targetYM, keyword, status, pageable
        );

        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/{deptId}/monthly/pending")
    public ResponseEntity<Page<DeptPendingAttendanceResponse>> deptApprovePendingAttendances (
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long deptId,
            @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        Page<DeptPendingAttendanceResponse> response =
                attendanceRetriever.retrieverDeptPendingAttendanceMonthly(
                        details.getEmpId(),
                        deptId,
                        pageable
                );

        return ResponseEntity.ok().body(response);
    }

    @PatchMapping("/{attendanceId}")
    public ResponseEntity<Void> updateAttendance(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long attendanceId,
            @RequestBody @Valid EditAttendanceByDeptManagerRequest request
    ) {
        attendanceEditing.updateAttendanceByDeptManager(details.getEmpId(), attendanceId, request);

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{attendanceId}/approval")
    public ResponseEntity<Void> approveAttendance(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long attendanceId,
            @RequestParam Long targetEmpId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime approvedAt
    ) {
        attendanceEditing.updateApproveAttendance(details.getEmpId(), attendanceId, new ApproveAttendanceByDeptManagerRequest(targetEmpId, approvedAt));

        return ResponseEntity.noContent().build();
    }

    private static YearMonth getYearMonth(@Nullable YearMonth yearMonth) {
        return yearMonth != null ? yearMonth : YearMonth.now(ZONE_SEOUL);
    }
}
