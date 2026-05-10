package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class DeptNotFoundException extends ApplicationException {
    public DeptNotFoundException() {
        super(ErrorCode.DEPT_NOT_FOUND_EXCEPTION);
    }
}