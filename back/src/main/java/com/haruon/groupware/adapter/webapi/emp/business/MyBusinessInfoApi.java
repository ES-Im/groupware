package com.haruon.groupware.adapter.webapi.emp.business;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/employees")
public class MyBusinessInfoApi {

    // 내 출장 신청이력 스케쥴 보기 -> BusinessManagementApi 참고해서 url 정돈 후 만들것
//    // 신청 이력 조회 -> 결재 진행률 조회 같이
//    @GetMapping("/request-history")
//    public ResponseEntity<List<LeaveRequestHistoryResponse>> myLeaveHistory(
//            @AuthenticationPrincipal EmpDetails details,
//            @RequestParam(required = false) ApprovalStatus approvalStatus,
//            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth yearMonth
//    ) {
//        YearMonth targetYM = yearMonth == null ? YearMonth.now(ZONE_SEOUL) : yearMonth;
//
//        List<LeaveRequestHistoryResponse> response = leaveDraftRetriever.retrieveMyLeaveRequestHistories(
//                details.getEmpId(),
//                approvalStatus, targetYM
//        );
//
//        return ResponseEntity.ok().body(response);
//    }
//
//    private int getTargetYear(Year year) {
//        return year == null ? LocalDate.now(ZONE_SEOUL).getYear() : year.getValue();
//    }
}
