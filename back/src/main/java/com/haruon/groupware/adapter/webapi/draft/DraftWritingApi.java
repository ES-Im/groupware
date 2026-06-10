package com.haruon.groupware.adapter.webapi.draft;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.draft.provided.forCommand.*;
import com.haruon.groupware.application.draft.service.command.dto.ApproversRequest;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.BusinessTripDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.CommonDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.LeaveDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.SalesDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.updateDraft.BusinessTripDraftUpdateRequest;
import com.haruon.groupware.application.draft.service.command.dto.updateDraft.CommonDraftUpdateRequest;
import com.haruon.groupware.application.draft.service.command.dto.updateDraft.LeaveDraftUpdateRequest;
import com.haruon.groupware.application.draft.service.command.dto.updateDraft.SalesDraftUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static com.haruon.groupware.application.utils.Utils.SEOUL_ZONE;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/drafts")
public class DraftWritingApi {

    private final GeneralDraftManagement generalDraftManagement;
    private final LeaveDraftManagement leaveDraftManagement;
    private final BusinessTripDraftManagement  businessTripDraftManagement;
    private final SalesDraftManagement salesDraftManagement;
    private final DraftManagementResolver draftManagementResolver;

    @PostMapping("/generals")
    public ResponseEntity<DraftIdResponse> createGeneralDraft(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid CommonDraftCreateRequest request
    ) {
        Long draftId = generalDraftManagement.createDraft(details.getEmpId(), request);

        return ResponseEntity.status(201).body(new DraftIdResponse(draftId));
    }

    @PostMapping("/leaves")
    public ResponseEntity<DraftIdResponse> createLeaveDraft(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid LeaveDraftCreateRequest request
    ) {
        Long draftId = leaveDraftManagement.createDraft(details.getEmpId(), request);

        return ResponseEntity.status(201).body(new DraftIdResponse(draftId));
    }

    @PostMapping("/business-trips")
    public ResponseEntity<DraftIdResponse> createBusinessTripDraft(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid BusinessTripDraftCreateRequest request
    ) {
        Long draftId = businessTripDraftManagement.createDraft(details.getEmpId(), request);

        return ResponseEntity.status(201).body(new DraftIdResponse(draftId));
    }

    @PostMapping("/sales")
    public ResponseEntity<DraftIdResponse> createSalesDraft(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid SalesDraftCreateRequest request
    ) {
        Long draftId = salesDraftManagement.createDraft(details.getEmpId(), request);

        return ResponseEntity.status(201).body(new DraftIdResponse(draftId));
    }

    @PostMapping("/generals/submission")
    public ResponseEntity<DraftIdResponse> createSubmittedGeneralDraft(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid CommonDraftCreateRequest request
    ) {
        Long draftId = generalDraftManagement.createSubmitted(details.getEmpId(), withSubmittedAt(request));

        return ResponseEntity.status(201).body(new DraftIdResponse(draftId));
    }

    @PostMapping("/leaves/submission")
    public ResponseEntity<DraftIdResponse> createSubmittedLeaveDraft(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid LeaveDraftCreateRequest request
    ) {
        Long draftId = leaveDraftManagement.createSubmitted(
                details.getEmpId(),
                new LeaveDraftCreateRequest(withSubmittedAt(request.param()), request.startAt(), request.endAt(), request.leaveType())
        );

        return ResponseEntity.status(201).body(new DraftIdResponse(draftId));
    }

    @PostMapping("/business-trips/submission")
    public ResponseEntity<DraftIdResponse> createSubmittedBusinessTripDraft(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid BusinessTripDraftCreateRequest request
    ) {
        Long draftId = businessTripDraftManagement.createSubmitted(
                details.getEmpId(),
                new BusinessTripDraftCreateRequest(
                        withSubmittedAt(request.param()),
                        request.startAt(),
                        request.endAt(),
                        request.destination(),
                        request.purpose(),
                        request.participantIds()
                )
        );

        return ResponseEntity.status(201).body(new DraftIdResponse(draftId));
    }

    @PostMapping("/sales/submission")
    public ResponseEntity<DraftIdResponse> createSubmittedSalesDraft(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid SalesDraftCreateRequest request
    ) {
        Long draftId = salesDraftManagement.createSubmitted(
                details.getEmpId(),
                new SalesDraftCreateRequest(
                        withSubmittedAt(request.param()),
                        request.franchiseId(),
                        request.reportMonth(),
                        request.salesAmount()
                )
        );

        return ResponseEntity.status(201).body(new DraftIdResponse(draftId));
    }

    @PatchMapping("/general/{draftId}")
    public ResponseEntity<Void> updateGeneralDraft(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long draftId,
            @RequestBody @Valid CommonDraftUpdateRequest request
    ) {
        generalDraftManagement.updateDraft(details.getEmpId(), draftId, request);

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/leaves/{draftId}")
    public ResponseEntity<Void> updateLeaveDraft(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long draftId,
            @RequestBody @Valid LeaveDraftUpdateRequest request
    ) {
        leaveDraftManagement.updateDraft(details.getEmpId(), draftId, request);

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/business-trips/{draftId}")
    public ResponseEntity<Void> updateBusinessTripDraft(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long draftId,
            @RequestBody @Valid BusinessTripDraftUpdateRequest request
    ) {
        businessTripDraftManagement.updateDraft(details.getEmpId(), draftId, request);

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/sales/{draftId}")
    public ResponseEntity<Void> updateSalesDraft(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long draftId,
            @RequestBody @Valid SalesDraftUpdateRequest request
    ) {
        salesDraftManagement.updateDraft(details.getEmpId(), draftId, request);

        return ResponseEntity.noContent().build();
    }


    @PatchMapping("/{draftId}/submission")
    public ResponseEntity<Void> submitDraft(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long draftId,
            @RequestBody(required = false) List<@Valid ApproversRequest> request
    ) {
        draftManagementResolver.submit(
                draftId,
                details.getEmpId(),
                LocalDateTime.now(SEOUL_ZONE),
                request
        );

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{draftId}/submission-withdrawal")
    public ResponseEntity<Void> withdrawSubmission(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long draftId
    ) {
        draftManagementResolver.revertToDraft(draftId, details.getEmpId());

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{sourceDraftId}/cancellation-drafts")
    public ResponseEntity<DraftIdResponse> createCancellationDraft(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long sourceDraftId,
            @RequestBody @Valid CommonDraftCreateRequest request
    ) {
        Long draftId = draftManagementResolver.createCancelDraft(details.getEmpId(), sourceDraftId, request);

        return ResponseEntity.status(201).body(new DraftIdResponse(draftId));
    }

    @PostMapping("/{sourceDraftId}/cancellation-drafts/submission")
    public ResponseEntity<DraftIdResponse> createSubmittedCancellationDraft(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long sourceDraftId,
            @RequestBody @Valid CommonDraftCreateRequest request
    ) {
        Long draftId = draftManagementResolver.createSubmittedCancelDraft(
                details.getEmpId(),
                sourceDraftId,
                withSubmittedAt(request)
        );

        return ResponseEntity.status(201).body(new DraftIdResponse(draftId));
    }

    @PatchMapping("/business-trips/{draftId}/participants")
    public ResponseEntity<Void> updateBusinessTripParticipants(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long draftId,
            @RequestBody @Valid Set<Long> participantIds
    ) {
        businessTripDraftManagement.updateParticipants(draftId, details.getEmpId(), participantIds);

        return ResponseEntity.noContent().build();
    }

    private CommonDraftCreateRequest withSubmittedAt(CommonDraftCreateRequest request) {
        return new CommonDraftCreateRequest(
                request.title(),
                request.content(),
                request.approvers(),
                LocalDateTime.now(SEOUL_ZONE)
        );
    }

    public record DraftIdResponse(
            Long draftId
    ) {}


}
