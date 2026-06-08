package com.haruon.groupware.application.draft.provided.forRetriever;

import com.haruon.groupware.application.draft.service.query.dto.response.BusinessTripRequestHistoryAndEmpInfoResponse;
import com.haruon.groupware.application.draft.service.query.dto.response.BusinessTripRequestHistoryResponse;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.YearMonth;
import java.util.List;

public interface BusinessTripDraftRetriever {


    Page<BusinessTripRequestHistoryAndEmpInfoResponse> retrieveDeptBusinessTripRequestHistories(
            Long managerId,
            Long deptId,
            @Nullable String keyword,
            @Nullable ApprovalStatus approvalStatus,
            YearMonth yearMonth,
            Pageable pageable
    );


    List<BusinessTripRequestHistoryResponse> retrieveMyBusinessTripRequestHistories(
            Long empId,
            @Nullable ApprovalStatus approvalStatus,
            YearMonth yearMonth
    );
}
