package com.haruon.groupware.application.exception.draft;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class DraftNotApprovedException extends ApplicationException {
    public DraftNotApprovedException() {
        super(ErrorCode.DRAFT_NOT_APPROVED_EXCEPTION);
    }
}
