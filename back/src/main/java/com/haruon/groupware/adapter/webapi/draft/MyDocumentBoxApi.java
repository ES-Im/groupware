package com.haruon.groupware.adapter.webapi.draft;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.draft.provided.forRetriever.DocumentBoxRetriever;
import com.haruon.groupware.application.draft.service.query.dto.response.DocumentBoxResponse;
import com.haruon.groupware.application.draft.service.query.dto.response.MyDocumentBoxSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/document-box")
public class MyDocumentBoxApi {

    private final DocumentBoxRetriever documentBoxRetriever;

    @GetMapping("/me/submitted-drafts")
    public ResponseEntity<Page<DocumentBoxResponse>> mySubmittedDrafts(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        Page<DocumentBoxResponse> responses = documentBoxRetriever.retrieveMySubmittedDrafts(
                details.getEmpId(), keyword, pageable
        );

        return ResponseEntity.ok().body(responses);
    }

    @GetMapping("/me/unsubmitted-drafts")
    public ResponseEntity<Page<DocumentBoxResponse>> myUnsubmittedDrafts(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        Page<DocumentBoxResponse> responses = documentBoxRetriever.retrieveMyUnsubmittedDrafts(
                details.getEmpId(), keyword, pageable
        );

        return ResponseEntity.ok().body(responses);
    }

    @GetMapping("/me/pending-approval-drafts")
    public ResponseEntity<Page<DocumentBoxResponse>> pendingMyApprovalDrafts(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        Page<DocumentBoxResponse> responses = documentBoxRetriever.retrievePendingMyApprovalDrafts(
                details.getEmpId(),
                keyword,
                pageable
        );

        return ResponseEntity.ok().body(responses);
    }

    @GetMapping("/me/pending-approval-drafts/count")
    public ResponseEntity<Long> retrieveMyPendingApprovalCount(
            @AuthenticationPrincipal EmpDetails details
    ) {
        Long response = documentBoxRetriever.retrievePendingMyApprovalDraftsCount(
                details.getEmpId()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/summary")
    public ResponseEntity<MyDocumentBoxSummaryResponse> retrieveMyDocumentBoxSummary(
            @AuthenticationPrincipal EmpDetails details
    ) {
        MyDocumentBoxSummaryResponse response = documentBoxRetriever.retrieveMyDocumentBoxSummary(
                details.getEmpId(),
                details.getBelongings()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/accessible-documents")
    public ResponseEntity<Page<DocumentBoxResponse>> myAccessibleDocuments(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        Page<DocumentBoxResponse> responses = documentBoxRetriever.retrieveMyAccessibleDocuments(
                details.getEmpId(),
                details.getBelongings(),
                keyword,
                pageable
        );

        return ResponseEntity.ok().body(responses);
    }
}
