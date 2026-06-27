package com.haruon.groupware.application.employee.leave.required;

import com.haruon.groupware.application.employee.leave.service.query.dto.LeaveSummaryAndEmpInfoResponse;
import com.haruon.groupware.application.employee.leave.service.query.dto.LeaveSummaryResponse;
import com.haruon.groupware.application.employee.leave.service.query.dto.LeaveUsageSummaryResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LeaveQueryRepository {

    LeaveSummaryResponse findEmpLeaveSummaryByEmpIdAndYear(Long empId, Integer year);

    Page<LeaveSummaryAndEmpInfoResponse> findLeaveSummary(@Nullable String keyword, @Nullable Long deptId, Integer year, Pageable pageable);

    LeaveUsageSummaryResponse findLeaveUsageSummary(@Nullable Long deptId, Integer year);

}
