package com.haruon.groupware.application.empInfo.attendance.required;

import com.haruon.groupware.application.empInfo.attendance.service.dto.response.AttendanceInfoResponse;
import com.haruon.groupware.application.empInfo.attendance.service.dto.response.AttendanceInfoSummaryResponse;
import com.haruon.groupware.application.empInfo.attendance.service.dto.response.result.DeptAttendanceResponse;
import com.haruon.groupware.application.empInfo.attendance.service.dto.response.result.DeptPendingAttendanceResponse;
import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;
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
