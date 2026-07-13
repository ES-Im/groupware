package com.haruon.groupware.adapter.webapi.franchise;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.franchise.provided.forCommand.FranchiseManagement;
import com.haruon.groupware.application.franchise.provided.forRetriever.FranchiseRetriever;
import com.haruon.groupware.application.franchise.service.command.dto.FranchiseCreateRequest;
import com.haruon.groupware.application.franchise.service.command.dto.FranchiseUpdateRequest;
import com.haruon.groupware.application.franchise.service.query.dto.AssignableManagerResponse;
import com.haruon.groupware.application.franchise.service.query.dto.FranchisesDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.FranchisesResponse;
import com.haruon.groupware.domain.franchise.BusinessStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;


@RestController
@RequestMapping("/api/franchises")
@RequiredArgsConstructor
public class FranchiseApi {

    private final FranchiseRetriever franchiseRetriever;
    private final FranchiseManagement franchiseManagement;

    @GetMapping
    public ResponseEntity<Page<FranchisesResponse>> getFranchises(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) BusinessStatus status,
            @RequestParam(required = false) Long managerId,
            @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        Page<FranchisesResponse> responses = franchiseRetriever
                .retrieveFranchises(details.getEmpId(), keyword, status, managerId, pageable);

        return ResponseEntity.ok().body(responses);
    }

    @GetMapping("/assignable-managers")
    public ResponseEntity<List<AssignableManagerResponse>> getAssignableManagers(
            @AuthenticationPrincipal EmpDetails details
    ) {
        List<AssignableManagerResponse> responses = franchiseRetriever
                .retrieveAssignableManagers(details.getEmpId());

        return ResponseEntity.ok().body(responses);
    }

    @GetMapping("/{franchiseId}")
    public ResponseEntity<FranchisesDetailResponse> getFranchise(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long franchiseId
    ) {
        FranchisesDetailResponse response = franchiseRetriever
                .retrieveFranchise(details.getEmpId(), franchiseId);

        return ResponseEntity.ok().body(response);
    }

    @PostMapping
    public ResponseEntity<FranchiseIdResponse> registerFranchises(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid FranchiseCreateRequest request
    ) {
        long franchiseId = franchiseManagement.createFranchise(details.getEmpId(), request);

        return ResponseEntity.status(201).body(new FranchiseIdResponse(franchiseId));
    }

    @PatchMapping("/{franchiseId}")
    public ResponseEntity<Void> updateFranchise(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long franchiseId,
            @RequestBody @Valid FranchiseUpdateRequest request
    ) {
        franchiseManagement.updateFranchise(franchiseId, details.getEmpId(), request);

        return ResponseEntity.status(204).build();
    }

    @PatchMapping("/{franchiseId}/status")
    public ResponseEntity<Void> updateFranchiseStatus(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long franchiseId,
            @RequestParam BusinessStatus status
    ) {
        franchiseManagement.updateFranchiseStatus(franchiseId, details.getEmpId(), status);

        return ResponseEntity.status(204).build();
    }

    @PatchMapping("/{franchiseId}/managers")
    public ResponseEntity<Void> updateFranchiseManager(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long franchiseId,
            @RequestParam Long newManagerId
    ) {
        franchiseManagement.updateManager(franchiseId, details.getEmpId(), newManagerId);

        return ResponseEntity.status(204).build();
    }

    @PatchMapping("/{franchiseId}/memo")
    public ResponseEntity<Void> updateFranchiseManager(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long franchiseId,
            @RequestBody @Valid MemoRequest request
    ) {
        franchiseManagement.updateMemo(franchiseId, details.getEmpId(), request.memo());

        return ResponseEntity.status(204).build();
    }

    @PatchMapping("/{franchiseId}/clear-memo")
    public ResponseEntity<Void> updateFranchiseManager(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long franchiseId
    ) {
        franchiseManagement.clearMemo(franchiseId, details.getEmpId());

        return ResponseEntity.status(204).build();
    }

    public record MemoRequest(
            @NotBlank String memo
    ) {}

    public record FranchiseIdResponse(
            Long franchiseId
    ) {}

}
