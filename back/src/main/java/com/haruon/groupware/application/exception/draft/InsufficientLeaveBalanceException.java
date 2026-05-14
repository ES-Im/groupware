package com.haruon.groupware.application.exception.draft;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class InsufficientLeaveBalanceException extends ApplicationException {
    public InsufficientLeaveBalanceException() {
        super(ApplicationErrorCode.INSUFFICIENT_LEAVE_BALANCE_EXCEPTION);
    }
}