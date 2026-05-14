package com.haruon.groupware.application.exception.draft;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class ApprovalLineRequiredException extends ApplicationException {
    public ApprovalLineRequiredException() {
        super(ApplicationErrorCode.APPROVAL_LINE_REQUIRED_EXCEPTION);
    }
}
