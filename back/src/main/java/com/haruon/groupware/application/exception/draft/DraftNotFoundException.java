package com.haruon.groupware.application.exception.draft;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class DraftNotFoundException extends ApplicationException {
    public DraftNotFoundException() {
        super(ApplicationErrorCode.DRAFT_NOT_FOUND_EXCEPTION);
    }
}
