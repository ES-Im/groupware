package com.haruon.groupware.application.exception.common.role;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class ActiveEmployeeNotFoundException extends ApplicationException {

    public ActiveEmployeeNotFoundException() {
        super(ErrorCode.ACTIVE_EMPLOYEE_NOT_FOUND_EXCEPTION);
    }

}
