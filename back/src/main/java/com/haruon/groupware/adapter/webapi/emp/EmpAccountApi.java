package com.haruon.groupware.adapter.webapi.emp;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.adapter.webapi.emp.dto.request.EmpRegisterRequest;
import com.haruon.groupware.adapter.webapi.emp.dto.request.EmpUpdateRequest;
import com.haruon.groupware.application.empInfo.empService.dto.response.BelongingInfo;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpFileInfo;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpInfoResponse;
import com.haruon.groupware.application.empInfo.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.provided.EmpAccountRetriever;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/emp")
public class EmpAccountApi {
    
    private final EmpAccountManager empAccountManager;
    private final EmpAccountRetriever retriever;

    @PostMapping
    public ResponseEntity<Void> register(
            @RequestBody @Valid EmpRegisterRequest request
    ) {
        empAccountManager.registerEmp(request.toRequestBySelf());

        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<EmpInfoResponse> me(
             @AuthenticationPrincipal EmpDetails details
    ) {
        EmpInfoResponse response = retriever.retrieveEmpAccountInfo(details.getUsername());

        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/me/files")
    public ResponseEntity<List<EmpFileInfo>> meFiles(
            @AuthenticationPrincipal EmpDetails details
    ) {
        List<EmpFileInfo> response = retriever.retrieveEmpFilesInfo(details.getUsername());

        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/me/belongings")
    public ResponseEntity<List<BelongingInfo>> meBelongings(
            @AuthenticationPrincipal EmpDetails details
    ) {
        List<BelongingInfo> response = retriever.retrieveEmpBelongingsInfo(details.getUsername());

        return ResponseEntity.ok().body(response);
    }

    // 여기까지 우선

    @PatchMapping("/me")
    public ResponseEntity<Void> updateMe(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid EmpUpdateRequest request
    ) {
        empAccountManager.updateInfoBySelf(
                request.toEmpUpdateRequestBySelf(details)
        );

        return ResponseEntity.ok().build();
    }










}
