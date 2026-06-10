package com.haruon.groupware.adapter.webapi.draft;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.draft.provided.forCommand.DraftManagementResolver;
import com.haruon.groupware.application.draft.service.command.dto.AddCirculationsRequest;
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
public class DraftCirculationApi {

    private final DraftManagementResolver draftManagementResolver;

    @PostMapping("/{draftId}/circulations")
    public ResponseEntity<Void> addCirculatedEmp(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long draftId,
            @RequestBody @Valid AddCirculationsRequest request
    ) {
        request.empIds().forEach(id ->
                draftManagementResolver.addCirculatedEmp(draftId, details.getEmpId(), id)
        );

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{draftId}/circulations/{empId}")
    public ResponseEntity<Void> removeCirculatedEmp(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long draftId,
            @PathVariable Long empId
    ) {
        draftManagementResolver.removeCirculatedEmp(draftId, details.getEmpId(), empId);

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{draftId}/circulations/me/read")
    public ResponseEntity<Void> markReadByCirculation(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long draftId
    ) {
        draftManagementResolver.markReadByCirculation(draftId, details.getEmpId(), LocalDateTime.now(SEOUL_ZONE));

        return ResponseEntity.noContent().build();
    }

}
