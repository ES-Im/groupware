package com.haruon.groupware.adapter.webapi.emp;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.adapter.webapi.emp.dto.request.EmpRegisterRequest;
import com.haruon.groupware.adapter.webapi.emp.dto.request.EmpUpdateRequest;
import com.haruon.groupware.adapter.webapi.emp.dto.response.EmpInfoResponse;
import com.haruon.groupware.application.empInfo.provided.EmpAccountManager;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/employees")
public class EmpAccountApi {
    
    private final EmpAccountManager empAccountManager;


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
        //todo QueryRepository 호출 usecase 구현
        log.info("me");
        log.info(details.toString());

        return ResponseEntity.ok().body(null);
    }

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
