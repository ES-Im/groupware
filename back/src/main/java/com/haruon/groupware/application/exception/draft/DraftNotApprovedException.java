package com.haruon.groupware.application.exception.draft;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class DraftNotApprovedException extends ApplicationException {
    public DraftNotApprovedException() {
        super(ApplicationErrorCode.DRAFT_NOT_APPROVED_EXCEPTION);
    }
}
