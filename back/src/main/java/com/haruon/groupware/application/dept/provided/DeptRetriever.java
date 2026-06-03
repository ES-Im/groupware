package com.haruon.groupware.application.dept.provided;

import com.haruon.groupware.application.dept.deptService.dto.response.DeptInfoResponse;
import com.haruon.groupware.application.dept.deptService.dto.response.projection.DeptMemberInfo;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DeptRetriever {

    Page<DeptInfoResponse> retrieverDeptInfoList (
            @Nullable Boolean isActive, @Nullable String keyword, Pageable pageable
    );

    Page<DeptMemberInfo> retrieverDeptMemberList (
            Long deptId, @Nullable String keyword, @Nullable Boolean isEmpActive, Pageable pageable
    );

    DeptInfoResponse retrieverDeptInfo (Long deptId);

}
