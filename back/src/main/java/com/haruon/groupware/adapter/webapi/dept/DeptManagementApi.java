package com.haruon.groupware.adapter.webapi.dept;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.dept.deptService.dto.request.DeptRegisterRequest;
import com.haruon.groupware.application.dept.provided.DeptManagement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Slf4j
@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DeptManagementApi {

    private final DeptManagement deptManagement;

    @PostMapping
    public ResponseEntity<Void> depts(
            @AuthenticationPrincipal EmpDetails details,
            @Valid @RequestBody DeptRegisterRequest request
    ) {
        deptManagement.registerDept(details.getEmpId(), request);

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{deptId}/activation")
    public ResponseEntity<Void> activateDept(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long deptId
    ) {
        deptManagement.activate(deptId, details.getEmpId());

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{deptId}/deactivation")
    public ResponseEntity<Void> deactivateDept(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long deptId
    )  {
        deptManagement.deactivate(deptId, details.getEmpId());

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{deptId}/name")
    public ResponseEntity<Void> updateDeptName(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long deptId,
            @RequestParam @Size(max = 20) @NotBlank String newName
    ) {
        deptManagement.updateDeptName(deptId, newName, details.getEmpId());

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{deptId}/parent")
    public ResponseEntity<Void> updateParentDept(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long deptId,
            @RequestParam(required = false) Long parentDeptId
    ) {
        deptManagement.changeParentDept(deptId, parentDeptId, details.getEmpId());

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{deptId}/leader/appointment")
    public ResponseEntity<Void> updateDeptLeader(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long deptId,
            @RequestParam Long leaderEmpId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate appointedAt
    ) {
        deptManagement.appointLeader(deptId, leaderEmpId, appointedAt, details.getEmpId());

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{deptId}/leader/end")
    public ResponseEntity<Void> endAppointmentLeader(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long deptId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endAt
    ) {
        deptManagement.endCurrentLeader(deptId, endAt, details.getEmpId());

        return ResponseEntity.noContent().build();
    }
}
