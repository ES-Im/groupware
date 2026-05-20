package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class DeptNotFoundException extends ApplicationException {
    public DeptNotFoundException() {
        super(ApplicationErrorCode.DEPT_NOT_FOUND_EXCEPTION);
    }
}