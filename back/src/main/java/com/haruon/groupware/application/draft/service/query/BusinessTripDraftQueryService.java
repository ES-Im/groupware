package com.haruon.groupware.application.draft.service.query;

import com.haruon.groupware.application.draft.provided.forRetriever.BusinessTripDraftRetriever;
import com.haruon.groupware.application.draft.required.BusinessTripDraftQueryRepository;
import com.haruon.groupware.application.draft.service.query.dto.response.BusinessTripRequestHistoryAndEmpInfoResponse;
import com.haruon.groupware.application.draft.service.query.dto.response.BusinessTripRequestHistoryResponse;
import com.haruon.groupware.application.utils.AuthValidator;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class BusinessTripDraftQueryService implements BusinessTripDraftRetriever {

    private final BusinessTripDraftQueryRepository businessTripDraftQueryRepository;
    private final AuthorizationQueryRepository authorizationQueryRepository;

    @Override
    public Page<BusinessTripRequestHistoryAndEmpInfoResponse> retrieveDeptBusinessTripRequestHistories(
            Long managerId,
            Long deptId,
            @Nullable String keyword,
            @Nullable ApprovalStatus approvalStatus,
            YearMonth yearMonth,
            Pageable pageable
    ) {
        AuthValidator.checkDeptManagerOrAdminByEmpIdAndDeptId(authorizationQueryRepository, managerId, deptId);

        return businessTripDraftQueryRepository.findBusinessTripRequestHistoriesByDeptIdAndYearMonth(
                deptId, yearMonth, keyword, approvalStatus, pageable
        );
    }

    @Override
    public List<BusinessTripRequestHistoryResponse> retrieveMyBusinessTripRequestHistories(
            Long empId,
            @Nullable ApprovalStatus approvalStatus,
            YearMonth yearMonth
    ) {
        return businessTripDraftQueryRepository.findBusinessTripRequestHistoriesByEmpIDAndYearMonth(
                empId, approvalStatus, yearMonth
        );
    }
}
