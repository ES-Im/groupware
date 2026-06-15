package com.haruon.groupware.application.franchise.provided.forRetriever;

import com.haruon.groupware.application.franchise.service.query.dto.education.EducationApplicantsResponse;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationsResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.YearMonth;
import java.util.List;

public interface FranchiseEducationRetriever {
    List<EducationsResponse> retrieveEducations(Long empId, YearMonth targetMonth);

    EducationDetailResponse retrieveEducation(Long empId, Long educationId);

    Page<EducationApplicantsResponse> retrieveApplicantsByEducationId(Long empId, Long educationId, Pageable pageable);
}
