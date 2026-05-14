package com.haruon.groupware.application.exception.common.role;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class ActiveEmployeeNotFoundException extends ApplicationException {

    public ActiveEmployeeNotFoundException() {
        super(ApplicationErrorCode.ACTIVE_EMPLOYEE_NOT_FOUND_EXCEPTION);
    }

}
