package com.haruon.groupware.adapter.webapi.employee.leave;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.employee.leave.provided.forCommand.LeaveGrantManagement;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/employees/{empId}/leaves")
public class EmployeeLeaveCommandApi {

    private final LeaveGrantManagement leaveGrantManagement;

    @PatchMapping("/special-grant-days")
    public ResponseEntity<Void> adjustSpecialLeave(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long empId,
            @RequestParam Double plusMinusDays
    ) {
        leaveGrantManagement.adjustSpecialGrantDays(
                details.getEmpId(), empId, plusMinusDays
        );

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/compensatory-grant-days")
    public ResponseEntity<Void> adjustCompensatoryLeave(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long empId,
            @RequestParam Double plusMinusDays
    ) {
        leaveGrantManagement.adjustCompensatoryGrantDays(
                details.getEmpId(), empId, plusMinusDays
        );

        return ResponseEntity.noContent().build();
    }
}
