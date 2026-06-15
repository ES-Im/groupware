package com.haruon.groupware.adapter.webapi.franchise;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.franchise.provided.forRetriever.FranchiseEducationRetriever;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationApplicantsResponse;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.time.YearMonth;

import static com.haruon.groupware.application.utils.Utils.ZONE_SEOUL;

@RestController
@RequestMapping("/api/franchise-educations")
@RequiredArgsConstructor
public class FranchiseEducationApi {

    private final FranchiseEducationRetriever franchiseEducationRetriever;

    @GetMapping("/calendar")
    public ResponseEntity<List<EducationsResponse>> getEducations(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth yearMonth
    ) {
        YearMonth targetMonth = yearMonth != null ? yearMonth : YearMonth.now(ZONE_SEOUL);

        List<EducationsResponse> responses = franchiseEducationRetriever
                .retrieveEducations(details.getEmpId(), targetMonth);

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

}
