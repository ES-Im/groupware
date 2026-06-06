package com.haruon.groupware.application.draft.service.query;

import com.haruon.groupware.application.draft.provided.forRetriever.LeaveDraftRetriever;
import com.haruon.groupware.application.draft.required.LeaveDraftQueryRepository;
import com.haruon.groupware.application.draft.service.query.dto.response.LeaveRequestHistoryResponse;
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

@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
public class LeaveDraftQueryService implements LeaveDraftRetriever {
    private final LeaveDraftQueryRepository leaveDraftQueryRepository;
    private final AuthorizationQueryRepository authorizationQueryRepository;

    @Override
    public List<LeaveRequestHistoryResponse> retrieveMyLeaveRequestHistories(
            Long empId,
            @Nullable ApprovalStatus approvalStatus,
            YearMonth yearMonth
    ) {
        return leaveDraftQueryRepository.findLeaveRequestHistoriesByEmpIdAndYearMonth(
                empId, approvalStatus, yearMonth
        );
    }

    @Override
    public Page<LeaveRequestHistoryResponse> retrieveDeptLeaveRequestHistories(
            Long managerId,
            Long deptId,
            @Nullable String keyword,
            @Nullable ApprovalStatus approvalStatus,
            YearMonth yearMonth,
            Pageable pageable
    ) {
        AuthValidator.checkDeptManagerOrAdminByEmpIdAndDeptId(authorizationQueryRepository, managerId, deptId);

        return leaveDraftQueryRepository.findLeaveRequestHistoriesByDeptIdAndYearMonth(
            deptId, yearMonth, keyword, approvalStatus, pageable
        );
    }
}
