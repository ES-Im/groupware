package com.haruon.groupware.adapter.webapi.emp.attendacne;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.empInfo.attendance.provided.AttendanceRecord;
import com.haruon.groupware.application.empInfo.attendance.provided.AttendanceRetriever;
import com.haruon.groupware.application.empInfo.attendance.service.dto.response.AttendanceInfoResponse;
import com.haruon.groupware.application.empInfo.attendance.service.dto.response.AttendanceInfoSummaryResponse;
import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;
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

import static com.haruon.groupware.application.utils.Utils.SEOUL_ZONE;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/employees/attendances/me")
public class MyAttendanceApi {

    private final AttendanceRetriever attendanceRetriever;
    private final AttendanceRecord attendanceRecord;

    @GetMapping("/monthly")
    public ResponseEntity<Page<AttendanceInfoResponse>> myAttendanceRecord (
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth yearMonth,
            @RequestParam(required = false) AttendanceStatus status,
            @PageableDefault(page = 0, size = 10) Pageable pageable
    ) {
        YearMonth targetYM = getYearMonth(yearMonth);

        Page<AttendanceInfoResponse> response =
                attendanceRetriever.retrieverMyAttendanceMonthly(
                        details.getEmpId(),
                        targetYM,
                        status,
                        pageable
                );

        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/monthly/summary")
    public ResponseEntity<AttendanceInfoSummaryResponse> myAttendanceSummary (
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth yearMonth
    ) {
        YearMonth targetYM = getYearMonth(yearMonth);

        AttendanceInfoSummaryResponse response =
                attendanceRetriever.retrieverMyAttendanceSummaryMonthly(
                        details.getEmpId(),
                        targetYM
                );

        return ResponseEntity.ok().body(response);
    }

    @PostMapping("/check-in")
    public ResponseEntity<Void> checkIn(
            @AuthenticationPrincipal EmpDetails details
    ) {
        attendanceRecord.recordCheckIn(details.getEmpId(), LocalDateTime.now(SEOUL_ZONE));

        return ResponseEntity.noContent().build();
    }


    @PatchMapping("/check-out")
    public ResponseEntity<Void> checkOut(
            @AuthenticationPrincipal EmpDetails details
    ) {
        attendanceRecord.recordCheckOut(details.getEmpId(), LocalDateTime.now(SEOUL_ZONE));

        return ResponseEntity.noContent().build();
    }

    private static YearMonth getYearMonth(@Nullable YearMonth yearMonth) {
        return yearMonth != null ? yearMonth : YearMonth.now(SEOUL_ZONE);
    }

}
