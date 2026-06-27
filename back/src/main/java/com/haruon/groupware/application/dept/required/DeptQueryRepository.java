package com.haruon.groupware.application.dept.required;

import com.haruon.groupware.application.dept.service.query.dto.DeptInfoResponse;
import com.haruon.groupware.application.dept.service.query.dto.projection.DeptMemberInfo;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

/**
 * 부서 관련 정보를 조회하는 Repository
 */
public interface DeptQueryRepository {

    /** 모든 부서 리스트 조회 */
    Page<DeptInfoResponse> findDeptInfoList (
            @Nullable Boolean isActive, @Nullable String keyword, Pageable pageable
    );

    /** 특정 부서의 멤버 리스트 조회 */
    Page<DeptMemberInfo> findDeptMembersListByDeptId(
            Long deptId, @Nullable String keyword, @Nullable Boolean isEmpActive, Pageable pageable
    );

    /** 특정 부서의 부서 정보 조회 */
    Optional<DeptInfoResponse> findDeptInfoByDeptId (Long deptId);
}
