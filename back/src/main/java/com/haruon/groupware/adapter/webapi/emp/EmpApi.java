package com.haruon.groupware.adapter.webapi.emp;

import com.haruon.groupware.application.empInfo.empService.dto.request.EmpRegisterRequest;
import com.haruon.groupware.application.empInfo.empService.dto.response.EmpInfoResponse;
import com.haruon.groupware.application.empInfo.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.provided.EmpAccountRetriever;
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

        return ResponseEntity.ok().build();
    }

    @GetMapping("/{empId}")
    public ResponseEntity<EmpInfoResponse> get(
            @PathVariable Long empId
    ) {
        EmpInfoResponse response = retriever.retrieveEmpAccountInfo(empId);

        return ResponseEntity.ok().body(response);
    }
}
