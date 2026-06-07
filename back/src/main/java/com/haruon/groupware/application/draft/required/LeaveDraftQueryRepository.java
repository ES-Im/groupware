package com.haruon.groupware.application.draft.required;

import com.haruon.groupware.application.draft.service.query.dto.response.LeaveRequestHistoryAndEmpInfoResponse;
import com.haruon.groupware.application.draft.service.query.dto.response.LeaveRequestHistoryResponse;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.YearMonth;
import java.util.List;

public interface LeaveDraftQueryRepository {
    List<LeaveRequestHistoryResponse> findLeaveRequestHistoriesByEmpIdAndYearMonth(Long empId, ApprovalStatus approvalStatus,YearMonth yearMonth);

    Page<LeaveRequestHistoryAndEmpInfoResponse> findLeaveRequestHistoriesByDeptIdAndYearMonth(Long deptId, YearMonth yearMonth, @Nullable String keyword, @Nullable ApprovalStatus approvalStatus, Pageable pageable);
}
