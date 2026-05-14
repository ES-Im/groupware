package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class EmpAlreadyActiveException extends ApplicationException {
    public EmpAlreadyActiveException() {
        super(ApplicationErrorCode.EMP_ALREADY_ACTIVE_EXCEPTION);
    }
}
