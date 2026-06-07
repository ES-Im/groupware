package com.haruon.groupware.adapter.webapi.emp.leave;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.draft.provided.forRetriever.LeaveDraftRetriever;
import com.haruon.groupware.application.draft.service.query.dto.response.LeaveRequestHistoryResponse;
import com.haruon.groupware.application.empInfo.leave.provided.LeaveRetriever;
import com.haruon.groupware.application.empInfo.leave.service.dto.response.LeaveSummaryResponse;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.Year;
import java.time.YearMonth;
import java.util.List;

import static com.haruon.groupware.application.utils.Utils.ZONE_SEOUL;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/employees/me/leaves")
public class MyLeaveInfoApi {

    private final LeaveRetriever leaveRetriever;
    private final LeaveDraftRetriever leaveDraftRetriever;

    // 내 잔여 휴가 조회 summary
    @GetMapping("/summary")
    public ResponseEntity<LeaveSummaryResponse> myLeaveSummary(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy") Year year
    ) {
        int targetYear = getTargetYear(year);

        LeaveSummaryResponse response = leaveRetriever.retrieverMyLeaveSummary(details.getEmpId(), targetYear);

        return ResponseEntity.ok().body(response);
    }

    // 신청 이력 조회 -> 결재 진행률 조회 같이
    @GetMapping("/request-history")
    public ResponseEntity<List<LeaveRequestHistoryResponse>> myLeaveHistory(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false)ApprovalStatus approvalStatus,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM")YearMonth yearMonth
    ) {
        YearMonth targetYM = yearMonth == null ? YearMonth.now(ZONE_SEOUL) : yearMonth;

        List<LeaveRequestHistoryResponse> response = leaveDraftRetriever.retrieveMyLeaveRequestHistories(
                details.getEmpId(),
                approvalStatus, targetYM
        );

        return ResponseEntity.ok().body(response);
    }

    private int getTargetYear(Year year) {
        return year == null ? LocalDate.now(ZONE_SEOUL).getYear() : year.getValue();
    }
}
