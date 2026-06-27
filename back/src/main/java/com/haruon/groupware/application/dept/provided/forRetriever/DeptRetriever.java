package com.haruon.groupware.application.dept.provided.forRetriever;

import com.haruon.groupware.application.dept.service.query.dto.DeptInfoResponse;
import com.haruon.groupware.application.dept.service.query.dto.projection.DeptMemberInfo;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DeptRetriever {

    Page<DeptInfoResponse> retrieveDeptInfoList(
            @Nullable Boolean isActive, @Nullable String keyword, Pageable pageable
    );

    Page<DeptMemberInfo> retrieveDeptMemberList(
            Long deptId, @Nullable String keyword, @Nullable Boolean isEmpActive, Pageable pageable
    );

    DeptInfoResponse retrieveDeptInfo(Long deptId);

}
