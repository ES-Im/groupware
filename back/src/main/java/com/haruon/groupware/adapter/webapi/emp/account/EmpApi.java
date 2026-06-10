package com.haruon.groupware.adapter.webapi.emp.account;

import com.haruon.groupware.application.empInfo.emp.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.emp.provided.EmpAccountRetriever;
import com.haruon.groupware.application.empInfo.emp.service.dto.request.EmpRegisterRequest;
import com.haruon.groupware.application.empInfo.emp.service.dto.response.EmpInfoResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/employees")
public class EmpApi {
    private final EmpAccountManager empAccountManager;
    private final EmpAccountRetriever retriever;

    @PostMapping
    public ResponseEntity<Void> register(
            @RequestBody @Valid EmpRegisterRequest request
    ) {
        empAccountManager.registerEmp(request);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{empId}")
    public ResponseEntity<EmpInfoResponse> getEmp(
            @PathVariable Long empId
    ) {
        EmpInfoResponse response = retriever.retrieveEmpAccountInfo(empId);

        return ResponseEntity.ok().body(response);
    }
}
