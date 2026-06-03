package com.haruon.groupware.application.dept.deptService;

import com.haruon.groupware.application.dept.deptService.dto.response.DeptInfoResponse;
import com.haruon.groupware.application.dept.deptService.dto.response.projection.DeptMemberInfo;
import com.haruon.groupware.application.dept.provided.DeptRetriever;
import com.haruon.groupware.application.dept.required.DeptQueryRepository;
import com.haruon.groupware.application.exception.empInfo.DeptNotFoundException;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DeptQueryService implements DeptRetriever {

    private final DeptQueryRepository deptQueryRepository;

    @Override
    public Page<DeptInfoResponse> retrieverDeptInfoList(
            @Nullable Boolean isActive,
            @Nullable String keyword,
            Pageable pageable
    ) {
        return deptQueryRepository.findDeptInfoList(
                isActive, keyword, pageable
        );
    }

    @Override
    public Page<DeptMemberInfo> retrieverDeptMemberList(
            Long deptId,
            @Nullable String keyword,
            @Nullable Boolean isEmpActive,
            Pageable pageable
    ) {
        return deptQueryRepository.findDeptMembersListByDeptId(
                deptId, keyword, isEmpActive, pageable
        );
    }

    @Override
    public DeptInfoResponse retrieverDeptInfo(Long deptId) {
        return deptQueryRepository.findDeptInfoByDeptId(deptId)
                .orElseThrow(DeptNotFoundException::new);
    }
}
