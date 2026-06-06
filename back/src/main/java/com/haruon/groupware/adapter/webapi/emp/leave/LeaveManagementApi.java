package com.haruon.groupware.adapter.webapi.emp.leave;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.draft.provided.forRetriever.LeaveDraftRetriever;
import com.haruon.groupware.application.draft.service.query.dto.response.LeaveRequestHistoryResponse;
import com.haruon.groupware.application.empInfo.leave.provided.LeaveGrantManagement;
import com.haruon.groupware.application.empInfo.leave.provided.LeaveRetriever;
import com.haruon.groupware.application.empInfo.leave.service.dto.response.LeaveSummaryAndEmpInfoResponse;
import com.haruon.groupware.application.empInfo.leave.service.dto.response.LeaveUsageSummaryResponse;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.Year;
import java.time.YearMonth;

import static com.haruon.groupware.application.utils.Utils.ZONE_SEOUL;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/employees")
public class LeaveManagementApi {

    private final LeaveGrantManagement leaveGrantManagement;
    private final LeaveRetriever leaveRetriever;
    private final LeaveDraftRetriever leaveDraftRetriever;


    // 어드민 - 특휴 조정 {empId}/leave/special
    @PatchMapping("/{empId}/leave/special")
    public ResponseEntity<Void> adjustSpecialLeave(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long empId,
            @RequestParam Double plusMinusDays
    ) {
        leaveGrantManagement.adjustSpecialGrantDays(
                details.getEmpId(), empId, plusMinusDays
        );

        return ResponseEntity.ok().build();
    }

    // 어드민 - 대휴 조정 {empId}/leave/compansatory
    @PatchMapping("/{empId}/leave/compansatory")
    public ResponseEntity<Void> adjustCompensatoryLeave(
        @AuthenticationPrincipal EmpDetails details,
        @PathVariable Long empId,
        @RequestParam Double plusMinusDays
    ) {
        leaveGrantManagement.adjustCompensatoryGrantDays(
                details.getEmpId(), empId, plusMinusDays
        );

        return ResponseEntity.ok().build();
    }

    // 어드민 - 모든 사원의 잔여 휴가 /leaves/summary : keyword, deptId, year
    @GetMapping("/leave/summary")
    public ResponseEntity<Page<LeaveSummaryAndEmpInfoResponse>> leaveSummary(
        @AuthenticationPrincipal EmpDetails details,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) Long deptId,
        @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy") Year year,
        @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        int targetYear = getTargetYear(year);

        Page<LeaveSummaryAndEmpInfoResponse> leaveSummaryResponse = leaveRetriever.retrieverLeaveSummary(
                details.getEmpId(),
                keyword, deptId, targetYear,
                pageable, true
        );

        return ResponseEntity.ok().body(leaveSummaryResponse);
    }


    // 어드민 - 회사 휴가 사용률 /company/leaves/usage-summary
    @GetMapping("/leave/usage-summary")
    public ResponseEntity<LeaveUsageSummaryResponse> leaveUsageSummary(
        @AuthenticationPrincipal EmpDetails details,
        @RequestParam(required = false) Long deptId,
        @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy") Year year
    ) {
        int targetYear = getTargetYear(year);

        LeaveUsageSummaryResponse response = leaveRetriever.retrieverLeaveUsageSummary(details.getEmpId(), deptId, targetYear, true);

        return ResponseEntity.ok().body(response);
    }

    // 부서매니저 - 현재 부서원들 잔여 휴가 /{deptId}/leaves : keyword, year
    @GetMapping("/{deptId}/leaves")
    public ResponseEntity<Page<LeaveSummaryAndEmpInfoResponse>> deptLeaveSummary(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long deptId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy") Year year,
            @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        int targetYear = getTargetYear(year);

        Page<LeaveSummaryAndEmpInfoResponse> response = leaveRetriever.retrieverLeaveSummary(
                details.getEmpId(), keyword, deptId, targetYear, pageable, false
        );

        return ResponseEntity.ok().body(response);
    }

    // 부서매니저 - 부서 휴가 사용률 조회 /{deptId}/leaves/usage-summary
    @GetMapping("/{deptId}/leaves/usage-summary")
    public ResponseEntity<LeaveUsageSummaryResponse> deptLeaveUsageSummary(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long deptId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy") Year year
    ) {
        int targetYear = getTargetYear(year);

        LeaveUsageSummaryResponse response = leaveRetriever.retrieverLeaveUsageSummary(details.getEmpId(), deptId, targetYear, false);

        return ResponseEntity.ok().body(response);
    }

    // 부서 매니저 - 현재 부서원들 휴가 신청 이력
    // -> 결재 진행률 조회 같이 /{deptId}/leaves/history : keyword, approval-status
    @GetMapping("/{deptId}/leaves/request-history")
    public ResponseEntity<Page<LeaveRequestHistoryResponse>> deptLeaveRequestHistory(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long deptId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ApprovalStatus approvalStatus,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth yearMonth,
            @PageableDefault(page = 0, size = 10) Pageable pageable
    ) {
        YearMonth targetYM = yearMonth == null ? YearMonth.now(ZONE_SEOUL) : yearMonth;

        Page<LeaveRequestHistoryResponse> response = leaveDraftRetriever.retrieveDeptLeaveRequestHistories(
                details.getEmpId(),
                deptId, keyword, approvalStatus, targetYM,
                pageable
        );

        return ResponseEntity.ok().body(response);
    }


    private int getTargetYear(Year year) {
        return year == null ? LocalDate.now(ZONE_SEOUL).getYear() : year.getValue();
    }
}
