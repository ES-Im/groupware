package com.haruon.groupware.adapter.exception.auth;

import com.haruon.groupware.adapter.exception.AdapterErrorCode;
import com.haruon.groupware.adapter.exception.AdapterException;

public class PendingApprovalLoginException extends AdapterException {
    public PendingApprovalLoginException() {
        super(AdapterErrorCode.PENDING_APPROVAL_LOGIN_EXCEPTION);
    }
}
