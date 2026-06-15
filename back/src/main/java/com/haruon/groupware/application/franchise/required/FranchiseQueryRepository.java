package com.haruon.groupware.application.franchise.required;

import com.haruon.groupware.application.franchise.service.query.dto.FranchisesDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.FranchisesResponse;
import com.haruon.groupware.domain.franchise.BusinessStatus;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FranchiseQueryRepository {

    FranchisesDetailResponse findFranchiseById(Long franchiseId);

    Page<FranchisesResponse> findFranchises(
            @Nullable String keyword,
            @Nullable BusinessStatus status,
            @Nullable Long managerId,
            Pageable pageable
    );

}
