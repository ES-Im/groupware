package com.haruon.groupware.adapter.webapi.franchise;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.adapter.webapi.DateSupport;
import com.haruon.groupware.adapter.webapi.RegisterDomainIdResponse;
import com.haruon.groupware.application.franchise.provided.forCommand.EducationManagement;
import com.haruon.groupware.application.franchise.provided.forRetriever.FranchiseEducationRetriever;
import com.haruon.groupware.application.franchise.service.command.dto.EducationCreateRequest;
import com.haruon.groupware.application.franchise.service.command.dto.EducationUpdateRequest;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationApplicantsResponse;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationsResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

import static com.haruon.groupware.adapter.webapi.DateSupport.resolveSearchPeriod;
import static com.haruon.groupware.application.utils.Utils.SEOUL_ZONE;

@RestController
@RequestMapping("/api/franchise-educations")
@RequiredArgsConstructor
public class FranchiseEducationApi {

    private final FranchiseEducationRetriever franchiseEducationRetriever;
    private final EducationManagement educationManagement;

    @GetMapping("/calendar")
    public ResponseEntity<List<EducationsResponse>> getEducations(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end
    ) {
        DateSupport.SearchPeriod searchPeriod = resolveSearchPeriod(start, end);

        List<EducationsResponse> responses = franchiseEducationRetriever
                .retrieveEducations(details.getEmpId(), searchPeriod.startDateTime(), searchPeriod.endDateTime());

        return ResponseEntity.ok().body(responses);
    }

    @GetMapping("/{educationId}")
    public ResponseEntity<EducationDetailResponse> getEducation(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long educationId
    ) {
        EducationDetailResponse response = franchiseEducationRetriever
                .retrieveEducation(details.getEmpId(), educationId);

        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/{educationId}/applicants")
    public ResponseEntity<Page<EducationApplicantsResponse>> getApplicants(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long educationId,
            @PageableDefault(page = 0, size = 10) Pageable pageable
    ) {
        Page<EducationApplicantsResponse> response = franchiseEducationRetriever
                .retrieveApplicantsByEducationId(details.getEmpId(), educationId, pageable);

        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/franchise/{franchiseId}")
    public ResponseEntity<List<EducationsResponse>> getFranchiseAppliedEducations(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long franchiseId,
            @RequestParam @Nullable Long month
    ) {
        long targetMonth =  month == null || month < 1 || month > 12
                ? LocalDateTime.now(SEOUL_ZONE).getMonthValue()
                : month;

        List<EducationsResponse> response = franchiseEducationRetriever
                .retrieveEducationsByFranchiseId(details.getEmpId(), franchiseId, targetMonth);

        return ResponseEntity.ok().body(response);
    }

    @PostMapping
    public ResponseEntity<RegisterDomainIdResponse> registerEducations(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid EducationCreateRequest request
    ) {
        long educationId = educationManagement.createEducation(details.getEmpId(), request);

        return ResponseEntity.status(201).body(new RegisterDomainIdResponse(educationId));
    }

    @PatchMapping("/{educationId}")
    public ResponseEntity<Void> updateEducation(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long educationId,
            @RequestBody @Valid EducationUpdateRequest request
    ) {
        educationManagement.updateEducation(educationId, details.getEmpId(), request);

        return ResponseEntity.status(204).build();
    }

    @PostMapping("/{educationId}/activation")
    public ResponseEntity<Void> updateEducationActivation(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long educationId
    ) {
        educationManagement.activate(educationId, details.getEmpId());

        return ResponseEntity.status(204).build();
    }

    @PostMapping("/{educationId}/deactivation")
    public ResponseEntity<Void> updateEducationDeactivation(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long educationId
    ) {
        educationManagement.deactivate(educationId, details.getEmpId());

        return ResponseEntity.status(204).build();
    }

    @DeleteMapping("/{educationId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long educationId
    ) {
        educationManagement.delete(educationId, details.getEmpId());

        return ResponseEntity.status(204).build();
    }

}
