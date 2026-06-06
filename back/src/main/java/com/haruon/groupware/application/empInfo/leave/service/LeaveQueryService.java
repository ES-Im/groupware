package com.haruon.groupware.application.empInfo.leave.service;

import com.haruon.groupware.application.empInfo.leave.provided.LeaveRetriever;
import com.haruon.groupware.application.empInfo.leave.required.LeaveQueryRepository;
import com.haruon.groupware.application.empInfo.leave.service.dto.response.LeaveSummaryAndEmpInfoResponse;
import com.haruon.groupware.application.empInfo.leave.service.dto.response.LeaveSummaryResponse;
import com.haruon.groupware.application.empInfo.leave.service.dto.response.LeaveUsageSummaryResponse;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.haruon.groupware.application.utils.AuthValidator.checkAdminById;
import static com.haruon.groupware.application.utils.AuthValidator.checkDeptManagerOrAdminByEmpIdAndDeptId;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class LeaveQueryService implements LeaveRetriever {

    private final LeaveQueryRepository leaveQueryRepository;
    private final AuthorizationQueryRepository authorizationQueryRepository;

    @Override
    public LeaveSummaryResponse retrieverMyLeaveSummary(Long empId, Integer year) {
        return leaveQueryRepository.findEmpLeaveSummaryByEmpIdAndYear(empId, year);
    }

    @Override
    public Page<LeaveSummaryAndEmpInfoResponse> retrieverLeaveSummary(
            Long adminOrDeptManagerId,
            @Nullable String keyword,
            @Nullable Long deptId,
            Integer year,
            Pageable pageable,
            Boolean isAdmin
    ) {
        if(isAdmin) {
            checkAdminById(authorizationQueryRepository, adminOrDeptManagerId);
        } else {
            if(deptId == null) throw new RequiredValueMissingException();
            checkDeptManagerOrAdminByEmpIdAndDeptId(authorizationQueryRepository, adminOrDeptManagerId, deptId);
        }

        return leaveQueryRepository.findLeaveSummary(keyword, deptId, year, pageable);
    }

    @Override
    public LeaveUsageSummaryResponse retrieverLeaveUsageSummary(
            Long adminOrDeptManagerId,
            @Nullable Long deptId,
            Integer year,
            Boolean isAdmin
    ) {
        if(isAdmin) {
            checkAdminById(authorizationQueryRepository, adminOrDeptManagerId);
        } else {
            if(deptId == null) throw new RequiredValueMissingException();
            checkDeptManagerOrAdminByEmpIdAndDeptId(authorizationQueryRepository, adminOrDeptManagerId, deptId);
        }

        return leaveQueryRepository.findLeaveUsageSummary(deptId, year);
    }
}
