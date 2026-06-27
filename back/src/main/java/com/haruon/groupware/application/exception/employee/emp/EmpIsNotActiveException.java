package com.haruon.groupware.application.exception.employee.emp;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class EmpIsNotActiveException extends ApplicationException {
    public EmpIsNotActiveException() {
        super(ApplicationErrorCode.EMP_IS_NOT_ACTIVE_EXCEPTION);
    }
}