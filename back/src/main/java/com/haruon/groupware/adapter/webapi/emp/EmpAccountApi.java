package com.haruon.groupware.adapter.webapi.emp;

import com.haruon.groupware.adapter.webapi.emp.dto.EmpInfoResponse;
import com.haruon.groupware.adapter.webapi.emp.dto.EmpRegisterRequest;
import com.haruon.groupware.adapter.webapi.emp.dto.EmpUpdateRequest;
import com.haruon.groupware.application.empInfo.empService.dto.EmpUpdateRequestBySelf;
import com.haruon.groupware.application.empInfo.provided.EmpAccountManager;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/emp")
public class EmpAccountApi {
    
    private final EmpAccountManager empAccountManager;

    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody @Valid EmpRegisterRequest request) {
        empAccountManager.registerEmp(request.toRequestBySelf());

        return ResponseEntity.ok().build();
    }

    @PostMapping("/me")
    public ResponseEntity<EmpInfoResponse> me() {
        //todo QueryRepository 호출 usecase 구현

        return ResponseEntity.ok().body(null);
    }

    @PatchMapping("/me")
    public ResponseEntity<Void> updateMe(EmpUpdateRequest request) {
        EmpUpdateRequestBySelf empUpdateRequestBySelf = request.toEmpUpdateRequestBySelf();
        empAccountManager.updateInfoBySelf(empUpdateRequestBySelf);

        return ResponseEntity.ok().build();
    }








}
