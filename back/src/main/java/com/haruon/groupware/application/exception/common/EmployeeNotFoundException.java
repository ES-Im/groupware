package com.haruon.groupware.application.exception.common;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class EmployeeNotFoundException extends ApplicationException {
    public EmployeeNotFoundException() {
        super(ApplicationErrorCode.EMPLOYEE_NOT_FOUND_EXCEPTION);
    }
}
