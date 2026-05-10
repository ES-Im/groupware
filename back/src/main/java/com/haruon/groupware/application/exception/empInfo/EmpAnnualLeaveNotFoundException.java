package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class EmpAnnualLeaveNotFoundException extends ApplicationException {
    public EmpAnnualLeaveNotFoundException() {
        super(ErrorCode.EMP_ANNUAL_LEAVE_NOT_FOUND_EXCEPTION);
    }
}