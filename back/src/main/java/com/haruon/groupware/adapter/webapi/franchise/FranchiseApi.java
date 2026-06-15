package com.haruon.groupware.adapter.webapi.franchise;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.franchise.provided.forRetriever.FranchiseRetriever;
import com.haruon.groupware.application.franchise.service.query.dto.FranchisesDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.FranchisesResponse;
import com.haruon.groupware.domain.franchise.BusinessStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/franchises")
@RequiredArgsConstructor
public class FranchiseApi {

    private final FranchiseRetriever franchiseRetriever;

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

    @GetMapping("/{franchiseId}")
    public ResponseEntity<FranchisesDetailResponse> getFranchise(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long franchiseId
    ) {
        FranchisesDetailResponse response = franchiseRetriever
                .retrieveFranchise(details.getEmpId(), franchiseId);

        return ResponseEntity.ok().body(response);
    }
}
