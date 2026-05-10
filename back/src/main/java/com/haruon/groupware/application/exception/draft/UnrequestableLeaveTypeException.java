package com.haruon.groupware.application.exception.draft;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class UnrequestableLeaveTypeException extends ApplicationException {
    public UnrequestableLeaveTypeException() {
        super(ErrorCode.UNREQUESTABLE_LEAVE_TYPE_EXCEPTION);
    }
}
