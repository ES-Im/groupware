package com.haruon.groupware.application.empInfo.provided;

import com.haruon.groupware.application.empInfo.empService.EmpAdminUpdateRequest;
import com.haruon.groupware.application.empInfo.empService.EmpDeptManagerUpdateRequest;
import com.haruon.groupware.application.empInfo.empService.EmpRegisterRequest;
import com.haruon.groupware.application.empInfo.empService.EmpSelfUpdateRequest;

/**
 * 사원관련 정보 등록 및 수정, 삭제
 */
public interface EmpAccountManager {
    
    /** return : 회원가입 성공여부 */
    int registerEmp(EmpRegisterRequest request);

    /** return : 사원가입 승인 성공여부 */
    int approveRegisterByAdmin(EmpAdminUpdateRequest adminRequest);

    /** return : 퇴직한 사원 정보 처리 성공여부 */
    int updateResignedEmpByAdmin(EmpAdminUpdateRequest adminRequest);

    /** return : 사원정보변경 성공여부 */
    int updateInfoBySelf(EmpSelfUpdateRequest request);

    /** return : 사원정보변경 성공여부 */
    int updateInfoByDeptManager(EmpDeptManagerUpdateRequest request);

    /** return : 사원정보변경 성공여부 */
    int updateInfoByAdmin(EmpAdminUpdateRequest request);

    /** return : 파일 삭제 성공여부 */
    int deleteEmpFile(Long empId, Long fileId);

    /** return : 파일 정보 변경 성공여부 → 파일 비활성화 나눌건지 ?*/
    int updateEmpFileBySelf(EmpSelfUpdateRequest request);

    /** return : 사원 소속정보 변경 성공여부 */
    int updateBelongingsByAdmin(EmpAdminUpdateRequest request);

    /** return : 파일 활성화/비활성화 성공여부 */
    int updateFileActiveStatus(EmpAdminUpdateRequest request);

    /** return : 파일 활성화/비활성화 성공여부 */
    int updateFileActiveStatus(EmpSelfUpdateRequest request);
}
