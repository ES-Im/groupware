package com.haruon.groupware.application.franchise.service.query;

import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.franchise.provided.forRetriever.FranchiseRetriever;
import com.haruon.groupware.application.franchise.required.FranchiseQueryRepository;
import com.haruon.groupware.application.franchise.service.query.dto.FranchisesDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.FranchisesResponse;
import com.haruon.groupware.application.utils.AuthValidator;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import com.haruon.groupware.domain.franchise.BusinessStatus;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FranchiseQueryService implements FranchiseRetriever {

    private final FranchiseQueryRepository franchiseQueryRepository;
    private final AuthorizationQueryRepository authorizationQueryRepository;

    @Override
    public Page<FranchisesResponse> retrieveFranchises(
            Long empId,
            @Nullable String keyword,
            @Nullable BusinessStatus status,
            @Nullable Long managerId,
            Pageable pageable
    ) {
        AuthValidator.checkFranchiseRoleEmp(authorizationQueryRepository, empId);

        return franchiseQueryRepository.findFranchises(
                keyword, status, managerId, pageable
        );
    }

    @Override
    public FranchisesDetailResponse retrieveFranchise(Long empId, Long franchiseId) {
        AuthValidator.checkFranchiseRoleEmp(authorizationQueryRepository, empId);

        return franchiseQueryRepository.findFranchiseById(franchiseId);
    }

}
