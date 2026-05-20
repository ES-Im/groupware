package com.haruon.groupware.application.exception.common.role;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class DepartmentMismatchException extends ApplicationException {
    public DepartmentMismatchException() {
        super(ApplicationErrorCode.DEPARTMENT_MISMATCH_EXCEPTION);
    }
}
