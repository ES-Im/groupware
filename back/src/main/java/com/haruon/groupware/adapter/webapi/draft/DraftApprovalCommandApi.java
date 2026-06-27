package com.haruon.groupware.adapter.webapi.draft;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.draft.provided.forCommand.DraftManagementResolver;
import com.haruon.groupware.application.draft.service.command.dto.DraftRejectRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

import static com.haruon.groupware.application.utils.Utils.SEOUL_ZONE;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/drafts")
public class DraftApprovalCommandApi {

    private final DraftManagementResolver draftManagementResolver;

    @PatchMapping("/{draftId}/approval")
    public ResponseEntity<Void> approveDraft(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long draftId
    ) {
        draftManagementResolver.approve(draftId, details.getEmpId(), LocalDateTime.now(SEOUL_ZONE));

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{draftId}/rejection")
    public ResponseEntity<Void> rejectDraft(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long draftId,
            @RequestBody @Valid DraftRejectRequest request
    ) {
        draftManagementResolver.reject(draftId, details.getEmpId(), request.reason(), LocalDateTime.now(SEOUL_ZONE));

        return ResponseEntity.noContent().build();
    }

}
