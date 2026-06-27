package com.haruon.groupware.application.employee.account.provided.forCommand;

import com.haruon.groupware.application.employee.account.service.command.dto.*;

import java.time.LocalDate;

/**
 * 사원관련 정보 등록 및 수정, 삭제
 */
public interface EmpAccountManager {
    
    void registerEmp(EmpRegisterRequest request);


    void updateInfoBySelf(EmpUpdateRequestBySelf request, Long empId);

    void updateFileActiveStatusBySelf(Long targetFileId, Boolean isForActivate, Long empId);


    void approveRegisterByHR(Long editorId, Long targetEmpId, LocalDate hiredAt);

    void updateResignedEmpByHR(Long editorId, Long targetEmpId, LocalDate resignedAt);

    void updateInfoByHR(Long editorId, Long targetEmpId, EmpUpdateRequestByHR request);

    void updateBelongingsByHR(EmpBelongingsParam request, Long editorId);

    void activateEmpByHR(Long editorId, Long targetId);

    void suspendEmpByHR(Long editorId, Long targetId);

    void updateFileActiveStatusByHR(Long editorId, Long targetEmpId, Long targetFileId, Boolean isForActivate);


    void updateInfoByDeptManager(Long managerId, Long targetEmpId, EmpUpdateRequestByDeptManager request);


}
