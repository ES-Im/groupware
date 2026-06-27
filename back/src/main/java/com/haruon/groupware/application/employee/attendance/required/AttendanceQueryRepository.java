package com.haruon.groupware.application.employee.attendance.required;

import com.haruon.groupware.application.employee.attendance.service.query.dto.AttendanceInfoResponse;
import com.haruon.groupware.application.employee.attendance.service.query.dto.AttendanceInfoSummaryResponse;
import com.haruon.groupware.application.employee.attendance.service.query.dto.result.DeptAttendanceResponse;
import com.haruon.groupware.application.employee.attendance.service.query.dto.result.DeptPendingAttendanceResponse;
import com.haruon.groupware.domain.employee.enums.AttendanceStatus;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.YearMonth;

public interface AttendanceQueryRepository {
    Page<AttendanceInfoResponse> findMonthlyAttendancesByEmpIdAndYearMonth(
            Long empId,
            YearMonth targetYearMonth,
            @Nullable AttendanceStatus status,
            Pageable pageable
    );

    AttendanceInfoSummaryResponse findMonthlySummaryByEmpIdAndYearMonth(
            Long empId,
            YearMonth targetYearMonth
    );

    Page<DeptPendingAttendanceResponse> findMonthlyNotApprovedAttendancesByDeptId(
            Long deptId,
            Pageable pageable
    );

    Page<DeptAttendanceResponse> findMonthlyAttendancesByDeptId(
            Long deptId,
            YearMonth targetYearMonth,
            @Nullable String empNameKeyword,
            @Nullable AttendanceStatus attendanceStatus,
            Pageable pageable
    );
}
