package com.haruon.groupware.application.exception.draft;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class DraftNonDeletableStateException extends ApplicationException {
    public DraftNonDeletableStateException() {
        super(ApplicationErrorCode.DRAFT_NON_DELETABLE_STATE_EXCEPTION);
    }
}
