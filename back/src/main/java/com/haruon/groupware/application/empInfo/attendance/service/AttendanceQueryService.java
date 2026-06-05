package com.haruon.groupware.application.empInfo.attendance.service;

import com.haruon.groupware.application.empInfo.attendance.provided.AttendanceRetriever;
import com.haruon.groupware.application.empInfo.attendance.required.AttendanceQueryRepository;
import com.haruon.groupware.application.empInfo.attendance.service.dto.response.AttendanceInfoResponse;
import com.haruon.groupware.application.empInfo.attendance.service.dto.response.AttendanceInfoSummaryResponse;
import com.haruon.groupware.application.empInfo.attendance.service.dto.response.result.DeptAttendanceResponse;
import com.haruon.groupware.application.empInfo.attendance.service.dto.response.result.DeptPendingAttendanceResponse;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;

import static com.haruon.groupware.application.utils.AuthValidator.checkDeptManagerOrAdminByEmpIdAndDeptId;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class AttendanceQueryService implements AttendanceRetriever {

    private final AttendanceQueryRepository attendanceQueryRepository;
    private final AuthorizationQueryRepository authorizationQueryRepository;

    @Override
    public Page<AttendanceInfoResponse> retrieverMyAttendanceMonthly(
            Long empId,
            YearMonth targetYearMonth,
            @Nullable AttendanceStatus status,
            Pageable pageable
    ) {
        return attendanceQueryRepository.findMonthlyAttendancesByEmpIdAndYearMonth(
                empId, targetYearMonth, status, pageable
        );
    }

    @Override
    public AttendanceInfoSummaryResponse retrieverMyAttendanceSummaryMonthly(
            Long empId,
            YearMonth targetYearMonth
    ) {
        return attendanceQueryRepository.findMonthlySummaryByEmpIdAndYearMonth(
                empId, targetYearMonth
        );
    }

    @Override
    public Page<DeptPendingAttendanceResponse> retrieverDeptPendingAttendanceMonthly(
            Long managerId,
            Long deptId,
            Pageable pageable
    ) {
        checkDeptManager(managerId, deptId);

        return attendanceQueryRepository.findMonthlyNotApprovedAttendancesByDeptId(
                deptId, pageable
        );
    }


    @Override
    public Page<DeptAttendanceResponse> retrieverDeptAttendanceMonthly(
            Long managerId,
            Long deptId,
            YearMonth targetYearMonth,
            @Nullable String empNameKeyword,
            @Nullable AttendanceStatus attendanceStatus,
            Pageable pageable
    ) {
        checkDeptManager(managerId, deptId);

        return attendanceQueryRepository.findMonthlyAttendancesByDeptId(
                deptId, targetYearMonth, empNameKeyword, attendanceStatus, pageable
        );
    }

    private void checkDeptManager(Long managerId, Long deptId) {
        checkDeptManagerOrAdminByEmpIdAndDeptId(authorizationQueryRepository, managerId, deptId);
    }
}
