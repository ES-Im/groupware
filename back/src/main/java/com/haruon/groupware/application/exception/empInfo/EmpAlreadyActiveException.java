package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class EmpAlreadyActiveException extends ApplicationException {
    public EmpAlreadyActiveException() {
        super(ErrorCode.EMP_ALREADY_ACTIVE_EXCEPTION);
    }
}
