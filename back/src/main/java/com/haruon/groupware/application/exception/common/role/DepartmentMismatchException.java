package com.haruon.groupware.application.exception.common.role;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class DepartmentMismatchException extends ApplicationException {
    public DepartmentMismatchException() {
        super(ErrorCode.DEPARTMENT_MISMATCH_EXCEPTION);
    }
}
