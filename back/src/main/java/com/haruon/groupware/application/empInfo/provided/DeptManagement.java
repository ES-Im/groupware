package com.haruon.groupware.application.empInfo.provided;

import com.haruon.groupware.application.empInfo.deptService.dto.DeptRegisterRequest;

/**
 * 부서관련 등록, 활성화설정, 정보 수정
 */
public interface DeptManagement {
    
    /** return 등록 성공 여부 */
    int registerDept(DeptRegisterRequest request);

    /** return 활성화 성공 여부 */
    int activate(Long deptId);

    /** return 비활성화 성공 여부 */
    int deactivate(Long deptId);

    /** return 정보수정 성공 여부 */
    int updateDeptName(Long deptId, String newDeptName);
}
