package com.haruon.groupware.adapter.webapi.emp.business;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/employees")
public class BusinessManagementApi {

    //todo - 사원의 연차 신청 이력 조회 메서드 참고해서 출장 스케쥴 조회api를 만들건데 이러면 url을 /employees/schedule 로 하는게 맞지 않나? 도메인 aggregate 의미랑 다르게 구성되있어서 나중에 내가 헷갈릴거 같은디... schedule 도메인 자체가 출장/연차 정보들을 모아서 정리 및 조회하는 용도니까....



    // 어드민 - 모든 사원의 출장 스케쥴 조회 /businessTrip : keyword, deptId, yearmonth
    // 참고 api 메서드
//    @GetMapping("/leaves/summary")
//    public ResponseEntity<Page<LeaveSummaryAndEmpInfoResponse>> leaveSummary(
//            @AuthenticationPrincipal EmpDetails details,
//            @RequestParam(required = false) String keyword,
//            @RequestParam(required = false) Long deptId,
//            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy") Year year,
//            @PageableDefault(size = 10, page = 0) Pageable pageable
//    ) {
//        int targetYear = getTargetYear(year);
//
//        Page<LeaveSummaryAndEmpInfoResponse> leaveSummaryResponse = leaveRetriever.retrieverLeaveSummary(
//                details.getEmpId(),
//                keyword, deptId, targetYear,
//                pageable, true
//        );
//
//        return ResponseEntity.ok().body(leaveSummaryResponse);
//    }

    // 부서 매니저 - 현재 부서원들 출장 신청 이력

    // 참고용 API -> 결재 진행률 조회 같이 /{deptId}/leaves/history : keyword, approval-status
//    @GetMapping("/{deptId}/leaves/request-history")
//    public ResponseEntity<Page<LeaveRequestHistoryAndEmpInfoResponse>> deptLeaveRequestHistory(
//            @AuthenticationPrincipal EmpDetails details,
//            @PathVariable Long deptId,
//            @RequestParam(required = false) String keyword,
//            @RequestParam(required = false) ApprovalStatus approvalStatus,
//            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth yearMonth,
//            @PageableDefault(page = 0, size = 10) Pageable pageable
//    ) {
//        YearMonth targetYM = yearMonth == null ? YearMonth.now(ZONE_SEOUL) : yearMonth;
//
//        Page<LeaveRequestHistoryAndEmpInfoResponse> response = leaveDraftRetriever.retrieveDeptLeaveRequestHistories(
//                details.getEmpId(),
//                deptId, keyword, approvalStatus, targetYM,
//                pageable
//        );
//
//        return ResponseEntity.ok().body(response);
//    }

}
