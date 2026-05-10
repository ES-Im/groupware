package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class DuplicateEmpNoException extends ApplicationException {
    public DuplicateEmpNoException() {
        super(ErrorCode.DUPLICATE_EMP_NO_EXCEPTION);
    }
}