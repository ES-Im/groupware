package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class EmpIsNotActiveException extends ApplicationException {
    public EmpIsNotActiveException() {
        super(ApplicationErrorCode.EMP_IS_NOT_ACTIVE_EXCEPTION);
    }
}