package com.haruon.groupware.adapter.webapi.draft;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.draft.provided.forRetriever.DocumentBoxRetriever;
import com.haruon.groupware.application.draft.service.query.dto.response.DocumentBoxResponse;
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

    // 내 기안함 조회 ( 상신 이후에거 전부 조회토록 하기 )
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

    // 임시저장 기안서 목록
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

    // 결재 대기함 조회 Pending My Approval
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

    // 문서함 페이징 (부서 내 문서 조회 가능 + 부서외에건 결재선이 있거나, 공람으로 되어있으면 가능)
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
