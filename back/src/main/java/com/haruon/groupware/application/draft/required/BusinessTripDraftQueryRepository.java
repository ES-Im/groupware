package com.haruon.groupware.application.draft.required;

import com.haruon.groupware.application.draft.service.query.dto.response.BusinessTripRequestHistoryAndEmpInfoResponse;
import com.haruon.groupware.application.draft.service.query.dto.response.BusinessTripRequestHistoryResponse;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.YearMonth;
import java.util.List;

public interface BusinessTripDraftQueryRepository {

    Page<BusinessTripRequestHistoryAndEmpInfoResponse> findBusinessTripRequestHistoriesByDeptIdAndYearMonth(
            Long deptId, YearMonth yearMonth, @Nullable String keyword, @Nullable ApprovalStatus approvalStatus, Pageable pageable
    );

    List<BusinessTripRequestHistoryResponse> findBusinessTripRequestHistoriesByEmpIDAndYearMonth(
            Long empId, @Nullable ApprovalStatus approvalStatus, YearMonth yearMonth
    );
}

