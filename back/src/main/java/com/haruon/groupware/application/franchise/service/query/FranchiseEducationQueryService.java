package com.haruon.groupware.application.franchise.service.query;

import com.haruon.groupware.application.exception.franchise.EducationNotFoundException;
import com.haruon.groupware.application.franchise.provided.forRetriever.FranchiseEducationRetriever;
import com.haruon.groupware.application.franchise.required.FranchiseEducationQueryRepository;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationApplicantsResponse;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationsResponse;
import com.haruon.groupware.application.utils.AuthValidator;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FranchiseEducationQueryService implements FranchiseEducationRetriever {

    private final FranchiseEducationQueryRepository franchiseEducationQueryRepository;
    private final AuthorizationQueryRepository authorizationQueryRepository;

    @Override
    public List<EducationsResponse> retrieveEducations(Long empId, LocalDateTime start, LocalDateTime end) {
        AuthValidator.checkFranchiseRoleEmp(authorizationQueryRepository, empId);

        return franchiseEducationQueryRepository.findEducationList(start, end);
    }

    @Override
    public EducationDetailResponse retrieveEducation(Long empId, Long educationId) {
        AuthValidator.checkFranchiseRoleEmp(authorizationQueryRepository, empId);

        return franchiseEducationQueryRepository.findEducationById(educationId)
                .orElseThrow(EducationNotFoundException::new);
    }

    @Override
    public Page<EducationApplicantsResponse> retrieveApplicantsByEducationId(
            Long empId, Long educationId, Pageable pageable
    ) {
        AuthValidator.checkFranchiseRoleEmp(authorizationQueryRepository, empId);

        return franchiseEducationQueryRepository.findApplicantsById(
                educationId, pageable
        );
    }
}
