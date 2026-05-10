package com.haruon.groupware.application.exception.draft;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class ApprovalLineRequiredException extends ApplicationException {
    public ApprovalLineRequiredException() {
        super(ErrorCode.APPROVAL_LINE_REQUIRED_EXCEPTION);
    }
}
