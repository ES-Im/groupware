package com.haruon.groupware.adapter.webapi.employee.account;

import com.haruon.groupware.application.employee.account.provided.forCommand.EmpAccountManager;
import com.haruon.groupware.application.employee.account.provided.forRetriever.EmpAccountRetriever;
import com.haruon.groupware.application.employee.account.service.command.dto.EmpRegisterRequest;
import com.haruon.groupware.application.employee.account.service.query.dto.BelongingInfo;
import com.haruon.groupware.application.employee.account.service.query.dto.EmpInfoResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/{empId}/belongings")
    public ResponseEntity<List<BelongingInfo>> getEmpBelongings(
            @PathVariable Long empId
    ) {
        List<BelongingInfo> response = retriever.retrieveEmpBelongingsInfo(empId);

        return ResponseEntity.ok().body(response);
    }
}
