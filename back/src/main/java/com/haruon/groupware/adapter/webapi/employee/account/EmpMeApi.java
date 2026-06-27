package com.haruon.groupware.adapter.webapi.employee.account;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.employee.account.provided.forCommand.EmpAccountManager;
import com.haruon.groupware.application.employee.account.provided.forRetriever.EmpAccountRetriever;
import com.haruon.groupware.application.employee.account.service.command.dto.EmpUpdateRequestBySelf;
import com.haruon.groupware.application.employee.account.service.query.dto.BelongingInfo;
import com.haruon.groupware.application.employee.account.service.query.dto.EmpFileListInfo;
import com.haruon.groupware.application.employee.account.service.query.dto.EmpInfoResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 본인의 사원 정보 조회, 수정 API
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/employees/me")
public class EmpMeApi {

    private final EmpAccountManager empAccountManager;
    private final EmpAccountRetriever retriever;

    @GetMapping
    public ResponseEntity<EmpInfoResponse> me(
            @AuthenticationPrincipal EmpDetails details
    ) {
        EmpInfoResponse response = retriever.retrieveEmpAccountInfo(details.getEmpId());

        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/files")
    public ResponseEntity<List<EmpFileListInfo>> meFiles(
            @AuthenticationPrincipal EmpDetails details
    ) {
        List<EmpFileListInfo> response = retriever.retrieveEmpFilesInfo(details.getEmpId());

        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/belongings")
    public ResponseEntity<List<BelongingInfo>> meBelongings(
            @AuthenticationPrincipal EmpDetails details
    ) {
        List<BelongingInfo> response = retriever.retrieveEmpBelongingsInfo(details.getEmpId());

        return ResponseEntity.ok().body(response);
    }

    @PatchMapping
    public ResponseEntity<Void> updateMe(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid EmpUpdateRequestBySelf request
    ) {
        empAccountManager.updateInfoBySelf(request, details.getEmpId());

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/files/{fileId}/status")
    public ResponseEntity<Void> updateMeFileStatus(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long fileId,
            @RequestParam("isForActivate") Boolean isForActivate
    ) {
        empAccountManager.updateFileActiveStatusBySelf(fileId, isForActivate, details.getEmpId());

        return ResponseEntity.noContent().build();
    }

}
