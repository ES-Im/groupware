package com.haruon.groupware.adapter.webapi.emp.account;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.empInfo.emp.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.emp.provided.EmpAccountRetriever;
import com.haruon.groupware.application.empInfo.emp.service.dto.request.EmpUpdateRequestByDeptManager;
import com.haruon.groupware.application.empInfo.emp.service.dto.request.EmpUpdateRequestByHR;
import com.haruon.groupware.application.empInfo.emp.service.dto.response.EmpBasicInfo;
import com.haruon.groupware.application.empInfo.emp.service.dto.response.EmpInfoForManagement;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import jakarta.validation.Valid;
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

/**
 * 부서 매니저 혹은 인사과 권한 사원의 사원 관리용 조회/정보 수정 API
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/employees")
public class EmpManagementApi {
    
    private final EmpAccountManager empAccountManager;
    private final EmpAccountRetriever retriever;

    @GetMapping
    public ResponseEntity<Page<EmpInfoForManagement>> empsForManagement(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) EmpStatus status,
            @RequestParam(required = false) String keyword,
            @PageableDefault(page = 0, size = 10) Pageable pageable
    ) {
        Page<EmpInfoForManagement> responses =
                retriever.retrieveEmpAccountInfoListForManagement(
                        details.getEmpId(),
                        details.getBelongings(),
                        deptId,
                        status,
                        keyword,
                        pageable
                );

        return ResponseEntity.ok().body(responses);
    }

    @GetMapping("/new")
    public ResponseEntity<Page<EmpBasicInfo>> newEmpsForManagement(
            @AuthenticationPrincipal EmpDetails empDetails,
            @RequestParam(required = false) String keyword,
            @PageableDefault(page = 0, size = 10) Pageable pageable
    ) {
        Page<EmpBasicInfo> newEmpList =
                retriever.retrieveNewEmpInfoList(
                        empDetails.getEmpId(),
                        keyword,
                        pageable
                );

        return ResponseEntity.ok().body(newEmpList);
    }

    /** By HR */
    @PatchMapping("/{empId}/registration-approval")
    public ResponseEntity<Void> approveRegistration(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long empId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hiredAt
    ) {
        empAccountManager.approveRegisterByHR(details.getEmpId(), empId, hiredAt);

        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{empId}/resignation")
    public ResponseEntity<Void> resignEmployee(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long empId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hiredAt
    ) {
        empAccountManager.updateResignedEmpByHR(details.getEmpId(), empId, hiredAt);

        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{empId}/status/activation")
    public ResponseEntity<Void> activateEmp(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long empId
    ) {
        empAccountManager.activateEmpByHR(details.getEmpId(), empId);

        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{empId}/status/suspension")
    public ResponseEntity<Void> suspendEmp(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long empId
    ) {
        empAccountManager.suspendEmpByHR(details.getEmpId(), empId);

        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{empId}/files/{fileId}/status")
    public ResponseEntity<Void> updateEmpFileStatus (   // 여기서 막힘
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long empId,
            @PathVariable Long fileId,
            @RequestParam("isForActivate") Boolean isForActivate
    ) {
        empAccountManager.updateFileActiveStatusByHR(details.getEmpId(), empId, fileId, isForActivate);

        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{empId}/hr-managed-info")
    public ResponseEntity<Void> updateEmp(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long empId,
            @RequestBody @Valid EmpUpdateRequestByHR request
    ) {
        empAccountManager.updateInfoByHR(details.getEmpId(), empId, request);

        return ResponseEntity.ok().build();
    }


    /** By Dept Manager */
    @PatchMapping("/{empId}/dept-managed-info")
    public ResponseEntity<Void> updateEmpInfoByDeptManager(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid EmpUpdateRequestByDeptManager request,
            @PathVariable Long empId
    ) {
        empAccountManager.updateInfoByDeptManager(details.getEmpId(), empId, request);

        return ResponseEntity.ok().build();
    }










}
