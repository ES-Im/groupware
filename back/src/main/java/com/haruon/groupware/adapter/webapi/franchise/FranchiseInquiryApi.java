package com.haruon.groupware.adapter.webapi.franchise;


import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.franchise.provided.forCommand.AnswerManagement;
import com.haruon.groupware.application.franchise.provided.forRetriever.FranchiseInquiryRetriever;
import com.haruon.groupware.application.franchise.service.command.dto.AnswerRequest;
import com.haruon.groupware.application.franchise.service.query.dto.inquiry.AnswerResponse;
import com.haruon.groupware.application.franchise.service.query.dto.inquiry.InquireDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.inquiry.InquiriesResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static com.haruon.groupware.application.utils.Utils.SEOUL_ZONE;

@RestController
@RequestMapping("/api/franchise-inquiries")
@RequiredArgsConstructor
public class FranchiseInquiryApi {

    private final FranchiseInquiryRetriever franchiseInquiryRetriever;
    private final AnswerManagement answerManagement;

    @GetMapping
    public ResponseEntity<Page<InquiriesResponse>> getInquiries(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) Boolean isAnswered,
            @RequestParam(required = false) Long assignedManagerId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate to,
            @PageableDefault(page = 0, size = 10) Pageable pageable
    ) {
        Page<InquiriesResponse> responses = franchiseInquiryRetriever
                .retrieveInquiries(details.getEmpId(), isAnswered, assignedManagerId, keyword, from, to, pageable);

        return ResponseEntity.ok().body(responses);
    }

    @GetMapping("/{inquiryId}")
    public ResponseEntity<InquireDetailResponse> getInquireDetail(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long inquiryId
    ) {
        InquireDetailResponse response = franchiseInquiryRetriever
                .retrieveInquiry(details.getEmpId(), inquiryId);

        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/{inquiryId}/answer")
    public ResponseEntity<AnswerResponse> getAnswer(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long inquiryId
    ) {
        Optional<AnswerResponse> response = franchiseInquiryRetriever
                .retrieveAnswer(details.getEmpId(), inquiryId);

        return response.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PatchMapping("/{inquiryId}/assign-answer")
    public ResponseEntity<Void> assignAnswerToInquiry(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long inquiryId,
            @RequestParam Long assignedEmpId
    ) {
        answerManagement.assignEmpToAnswer(inquiryId, details.getEmpId(), assignedEmpId);

        return ResponseEntity.status(204).build();
    }
    
    @PostMapping("/{inquiryId}/answers")
    public ResponseEntity<Void> createAnswerToInquiry(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long inquiryId,
            @RequestBody @Valid AnswerRequest request
    ) {
        answerManagement.createAnswerDraft(inquiryId, details.getEmpId(), request.answer());

        return ResponseEntity.status(201).build();
    }

    @PatchMapping("/{inquiryId}/answers")
    public ResponseEntity<Void> updateAnswerDraft(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long inquiryId,
            @RequestBody @Valid AnswerRequest request
    ) {
        answerManagement.updateAnswerDraft(inquiryId, details.getEmpId(), request.answer());

        return ResponseEntity.status(204).build();
    }

    @PatchMapping("/{inquiryId}/answers/send")
    public ResponseEntity<Void> sendAnswer(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long inquiryId
    ) {
        LocalDateTime now = LocalDateTime.now(SEOUL_ZONE);
        answerManagement.sendAnswer(inquiryId, details.getEmpId(), now);

        return ResponseEntity.status(204).build();
    }
}
