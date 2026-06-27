package com.haruon.groupware.adapter.webapi.employee.leave;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.employee.leave.provided.forRetriever.LeaveRetriever;
import com.haruon.groupware.application.employee.leave.service.query.dto.LeaveSummaryAndEmpInfoResponse;
import com.haruon.groupware.application.employee.leave.service.query.dto.LeaveSummaryResponse;
import com.haruon.groupware.application.employee.leave.service.query.dto.LeaveUsageSummaryResponse;
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

import static com.haruon.groupware.application.utils.Utils.ZONE_SEOUL;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class EmployeeLeaveQueryApi {
    private final LeaveRetriever leaveRetriever;

    @GetMapping("/employees/leaves/summary")
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

    @GetMapping("/employees/leaves/usage-summary")
    public ResponseEntity<LeaveUsageSummaryResponse> leaveUsageSummary(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy") Year year
    ) {
        int targetYear = getTargetYear(year);

        LeaveUsageSummaryResponse response = leaveRetriever.retrieverLeaveUsageSummary(details.getEmpId(), deptId, targetYear, true);

        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/departments/{deptId}/employees/leaves/summary")
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

    @GetMapping("/departments/{deptId}/employees/leaves/usage-summary")
    public ResponseEntity<LeaveUsageSummaryResponse> deptLeaveUsageSummary(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long deptId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy") Year year
    ) {
        int targetYear = getTargetYear(year);

        LeaveUsageSummaryResponse response = leaveRetriever.retrieverLeaveUsageSummary(details.getEmpId(), deptId, targetYear, false);

        return ResponseEntity.ok().body(response);
    }


    @GetMapping("/employees/me/leaves/summary")
    public ResponseEntity<LeaveSummaryResponse> myLeaveSummary(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy") Year year
    ) {
        int targetYear = getTargetYear(year);

        LeaveSummaryResponse response = leaveRetriever.retrieverMyLeaveSummary(details.getEmpId(), targetYear);

        return ResponseEntity.ok().body(response);
    }


    private int getTargetYear(Year year) {
        return year == null ? LocalDate.now(ZONE_SEOUL).getYear() : year.getValue();
    }

}
