package com.haruon.groupware.application.exception.employee.dept;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class DuplicateDeptException extends ApplicationException {
    public DuplicateDeptException() {
        super(ApplicationErrorCode.DUPLICATE_DEPT_EXCEPTION);
    }
}