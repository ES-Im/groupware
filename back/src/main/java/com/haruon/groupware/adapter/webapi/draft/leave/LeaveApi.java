package com.haruon.groupware.adapter.webapi.draft.leave;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.draft.provided.forRetriever.LeaveDraftRetriever;
import com.haruon.groupware.application.draft.service.query.dto.response.LeaveRequestHistoryAndEmpInfoResponse;
import com.haruon.groupware.application.draft.service.query.dto.response.LeaveRequestHistoryResponse;
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

import java.time.YearMonth;
import java.util.List;

import static com.haruon.groupware.application.utils.Utils.ZONE_SEOUL;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/leave")
public class LeaveApi {

    private final LeaveDraftRetriever leaveDraftRetriever;

    @GetMapping("/departments/{deptId}/request-history")
    public ResponseEntity<Page<LeaveRequestHistoryAndEmpInfoResponse>> deptLeaveRequestHistory(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long deptId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ApprovalStatus approvalStatus,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth yearMonth,
            @PageableDefault(page = 0, size = 10) Pageable pageable
    ) {
        YearMonth targetYM = yearMonth == null ? YearMonth.now(ZONE_SEOUL) : yearMonth;

        Page<LeaveRequestHistoryAndEmpInfoResponse> response = leaveDraftRetriever.retrieveDeptLeaveRequestHistories(
                details.getEmpId(),
                deptId, keyword, approvalStatus, targetYM,
                pageable
        );

        return ResponseEntity.ok().body(response);
    }


    @GetMapping("/employees/me/request-history")
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


}
