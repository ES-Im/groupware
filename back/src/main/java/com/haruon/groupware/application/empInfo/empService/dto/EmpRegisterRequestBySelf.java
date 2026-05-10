package com.haruon.groupware.application.empInfo.empService.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.utils.RegexpValidator;
import lombok.Builder;

@Builder
public record EmpRegisterRequestBySelf (

        String empNo,

        String empName,

        String loginId,

        String rawPassword
) {
        public EmpRegisterRequestBySelf {
                if(empNo == null || empName == null || loginId == null || rawPassword == null) {
                        throw new RequiredValueMissingException();
                }

                if(empName.isBlank()) throw new BlankValueNotAllowedException();

                RegexpValidator.empNoCheck(empNo);
                RegexpValidator.empIdCheck(loginId);
                RegexpValidator.passwordCheck(rawPassword);
        }
}
