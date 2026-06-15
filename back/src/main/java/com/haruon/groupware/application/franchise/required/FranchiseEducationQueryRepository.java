package com.haruon.groupware.application.franchise.required;

import com.haruon.groupware.application.franchise.service.query.dto.education.EducationApplicantsResponse;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationsResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

public interface FranchiseEducationQueryRepository {

    List<EducationsResponse> findEducationList(YearMonth targetMonth);

    Optional<EducationDetailResponse> findEducationById(Long educationId);

    Page<EducationApplicantsResponse> findApplicantsById(Long educationId, Pageable pageable);
}
