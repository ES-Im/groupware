package com.haruon.groupware.application.empInfo.deptService;


import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.utils.RegexpValidator;
import lombok.Builder;

@Builder
public record DeptRegisterRequest(

        Long adminId,

        String deptCode,

        String deptName

) {
    public DeptRegisterRequest {
        if(adminId == null || deptCode == null || deptName == null) {
            throw new RequiredValueMissingException();
        }

        if(deptCode.isBlank()) throw new BlankValueNotAllowedException();

        RegexpValidator.deptCodeCheck(deptCode);
    }
}
