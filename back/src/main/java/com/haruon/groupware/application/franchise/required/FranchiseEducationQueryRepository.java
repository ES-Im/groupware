package com.haruon.groupware.application.franchise.required;

import com.haruon.groupware.application.franchise.service.query.dto.education.EducationApplicantsResponse;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationsResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FranchiseEducationQueryRepository {

    List<EducationsResponse> findEducationList(LocalDateTime start, LocalDateTime end);

    Optional<EducationDetailResponse> findEducationById(Long educationId);

    Page<EducationApplicantsResponse> findApplicantsById(Long educationId, Pageable pageable);

    List<EducationsResponse> findEducationsByFranchiseId(Long franchiseId, long month);
}
