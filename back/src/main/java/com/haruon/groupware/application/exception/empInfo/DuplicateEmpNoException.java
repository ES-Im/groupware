package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class DuplicateEmpNoException extends ApplicationException {
    public DuplicateEmpNoException() {
        super(ApplicationErrorCode.DUPLICATE_EMP_NO_EXCEPTION);
    }
}