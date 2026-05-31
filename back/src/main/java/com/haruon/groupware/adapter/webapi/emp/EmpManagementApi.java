package com.haruon.groupware.adapter.webapi.emp;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpBasicInfo;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpFileListInfo;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpInfoForManagement;
import com.haruon.groupware.application.empInfo.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.provided.EmpAccountRetriever;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/{empId}/profile")
    public ResponseEntity<Page<EmpFileListInfo>> empProfile(
            @AuthenticationPrincipal EmpDetails empDetails,
            @PathVariable Long empId,
            @PageableDefault(page = 0, size = 10) Pageable pageable
    ) {
        return ResponseEntity.ok().body(null);
    }









}
