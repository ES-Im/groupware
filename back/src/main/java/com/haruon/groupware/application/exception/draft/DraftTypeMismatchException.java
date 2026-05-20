package com.haruon.groupware.application.exception.draft;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class DraftTypeMismatchException extends ApplicationException {
    public DraftTypeMismatchException() {
        super(ApplicationErrorCode.DRAFT_TYPE_MISMATCH_EXCEPTION);
    }
}
