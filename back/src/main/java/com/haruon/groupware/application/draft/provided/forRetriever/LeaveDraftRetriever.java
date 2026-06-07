package com.haruon.groupware.application.draft.provided.forRetriever;

import com.haruon.groupware.application.draft.service.query.dto.response.LeaveRequestHistoryAndEmpInfoResponse;
import com.haruon.groupware.application.draft.service.query.dto.response.LeaveRequestHistoryResponse;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.YearMonth;
import java.util.List;

public interface LeaveDraftRetriever {

    List<LeaveRequestHistoryResponse> retrieveMyLeaveRequestHistories(
            Long empId,
            @Nullable ApprovalStatus approvalStatus,
            YearMonth yearMonth
    );

    Page<LeaveRequestHistoryAndEmpInfoResponse> retrieveDeptLeaveRequestHistories(
            Long managerId,
            Long deptId,
            @Nullable String keyword,
            @Nullable ApprovalStatus approvalStatus,
            YearMonth yearMonth,
            Pageable pageable
    );

}
