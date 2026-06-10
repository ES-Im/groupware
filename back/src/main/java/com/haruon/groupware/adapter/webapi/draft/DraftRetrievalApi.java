package com.haruon.groupware.adapter.webapi.draft;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.draft.provided.forRetriever.DocumentBoxRetriever;
import com.haruon.groupware.application.draft.service.query.dto.response.DraftDetailResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/drafts")
public class DraftRetrievalApi {

    private final DocumentBoxRetriever documentBoxRetriever;

    @GetMapping("/{draftId}")
    public ResponseEntity<DraftDetailResponse> retrieveDraftDetail(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long draftId
    ) {
        DraftDetailResponse response = documentBoxRetriever.retrieveDraftDetail(
                details.getEmpId(),
                details.getBelongings(),
                draftId
        );

        return ResponseEntity.ok(response);
    }
}
