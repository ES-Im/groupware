package com.haruon.groupware.application.exception.draft;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class InsufficientLeaveBalanceException extends ApplicationException {
    public InsufficientLeaveBalanceException() {
        super(ErrorCode.INSUFFICIENT_LEAVE_BALANCE_EXCEPTION);
    }
}