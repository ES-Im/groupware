package com.haruon.groupware.application.empInfo.provided;

import com.haruon.groupware.application.empInfo.deptService.DeptRegisterRequest;

/**
 * 부서관련 등록, 활성화설정, 정보 수정
 */
public interface DeptManagement {
    
    /** return 등록 성공 여부 */
    void registerDept(DeptRegisterRequest request);

    /** return 활성화 성공 여부 */
    void activate(Long deptId, Long adminId);

    /** return 비활성화 성공 여부 */
    void deactivate(Long deptId, Long adminId);

    /** return 정보수정 성공 여부 */
    void updateDeptName(Long deptId, String newDeptName, Long adminId);
}
