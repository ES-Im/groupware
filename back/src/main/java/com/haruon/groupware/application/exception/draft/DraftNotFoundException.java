package com.haruon.groupware.application.exception.draft;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class DraftNotFoundException extends ApplicationException {
    public DraftNotFoundException() {
        super(ErrorCode.DRAFT_NOT_FOUND_EXCEPTION);
    }
}
