package com.haruon.groupware.application.exception.common;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class EmployeeNotFoundException extends ApplicationException {
    public EmployeeNotFoundException() {
        super(ErrorCode.EMPLOYEE_NOT_FOUND_EXCEPTION);
    }
}
