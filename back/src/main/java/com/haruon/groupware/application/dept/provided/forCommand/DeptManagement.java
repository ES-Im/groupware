package com.haruon.groupware.application.dept.provided.forCommand;

import com.haruon.groupware.application.dept.service.command.dto.DeptRegisterRequest;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

/**
 * 부서관련 등록, 활성화설정, 정보 수정
 */
public interface DeptManagement {
    
    void registerDept(Long adminId, DeptRegisterRequest request);

    void activate(Long deptId, Long adminId);

    void deactivate(Long deptId, Long adminId);

    void updateDeptName(Long deptId, String newDeptName, Long adminId);

    void changeParentDept(Long deptId, @Nullable Long parentDeptId, Long adminId);

    void appointLeader(Long deptId, Long leaderEmpId, LocalDate startAt, Long adminId);

    void endCurrentLeader(Long deptId, LocalDate endAt, Long adminId);
}
