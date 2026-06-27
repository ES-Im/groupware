package com.haruon.groupware.application.exception.employee.dept;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class DeptIsNotActiveException extends ApplicationException {
    public DeptIsNotActiveException() {
        super(ApplicationErrorCode.Dept_IS_NOT_ACTIVE_EXCEPTION);
    }
}