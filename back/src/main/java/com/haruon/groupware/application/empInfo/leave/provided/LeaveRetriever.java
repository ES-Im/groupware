package com.haruon.groupware.application.empInfo.leave.provided;

import com.haruon.groupware.application.empInfo.leave.service.dto.response.LeaveSummaryAndEmpInfoResponse;
import com.haruon.groupware.application.empInfo.leave.service.dto.response.LeaveSummaryResponse;
import com.haruon.groupware.application.empInfo.leave.service.dto.response.LeaveUsageSummaryResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LeaveRetriever {

    LeaveSummaryResponse retrieverMyLeaveSummary(
            Long empId,
            Integer year
    );


    Page<LeaveSummaryAndEmpInfoResponse> retrieverLeaveSummary(
            Long adminOrDeptManagerId,
            @Nullable String keyword,
            @Nullable Long deptId,
            Integer year,
            Pageable pageable,
            Boolean isAdmin
    );



    LeaveUsageSummaryResponse retrieverLeaveUsageSummary(
            Long adminOrDeptManagerId,
            @Nullable Long deptId,
            Integer year,
            Boolean isAdmin
    );


}
