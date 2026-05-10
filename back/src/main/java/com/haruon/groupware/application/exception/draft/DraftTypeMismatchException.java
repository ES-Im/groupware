package com.haruon.groupware.application.exception.draft;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class DraftTypeMismatchException extends ApplicationException {
    public DraftTypeMismatchException() {
        super(ErrorCode.DRAFT_TYPE_MISMATCH_EXCEPTION);
    }
}
