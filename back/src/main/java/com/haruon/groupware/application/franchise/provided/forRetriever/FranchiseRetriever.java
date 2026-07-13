package com.haruon.groupware.application.franchise.provided.forRetriever;

import com.haruon.groupware.application.franchise.service.query.dto.AssignableManagerResponse;
import com.haruon.groupware.application.franchise.service.query.dto.FranchisesDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.FranchisesResponse;
import com.haruon.groupware.domain.franchise.BusinessStatus;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

/**
 * 가맹점 기본정보 제공
 */
public interface FranchiseRetriever {

    Page<FranchisesResponse> retrieveFranchises (
            Long empId,
            @Nullable String keyword,
            @Nullable BusinessStatus status,
            @Nullable Long managerId,
            Pageable pageable
    );

    FranchisesDetailResponse retrieveFranchise(Long empId, Long franchiseId);

    List<AssignableManagerResponse> retrieveAssignableManagers(Long empId);
}
