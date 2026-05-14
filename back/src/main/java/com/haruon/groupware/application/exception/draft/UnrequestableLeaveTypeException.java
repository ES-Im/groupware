package com.haruon.groupware.application.exception.draft;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class UnrequestableLeaveTypeException extends ApplicationException {
    public UnrequestableLeaveTypeException() {
        super(ApplicationErrorCode.UNREQUESTABLE_LEAVE_TYPE_EXCEPTION);
    }
}
