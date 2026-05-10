package com.haruon.groupware.application.exception.empInfo;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class DuplicateDeptException extends ApplicationException {
    public DuplicateDeptException() {
        super(ErrorCode.DUPLICATE_DEPT_EXCEPTION);
    }
}