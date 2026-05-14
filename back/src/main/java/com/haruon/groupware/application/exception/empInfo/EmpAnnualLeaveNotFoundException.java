package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class EmpAnnualLeaveNotFoundException extends ApplicationException {
    public EmpAnnualLeaveNotFoundException() {
        super(ApplicationErrorCode.EMP_ANNUAL_LEAVE_NOT_FOUND_EXCEPTION);
    }
}