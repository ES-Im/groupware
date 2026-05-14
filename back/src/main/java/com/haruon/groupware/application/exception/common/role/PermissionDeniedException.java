package com.haruon.groupware.application.exception.common.role;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class PermissionDeniedException extends ApplicationException {
    public PermissionDeniedException() {
        super(ApplicationErrorCode.PERMISSION_DENIED_EXCEPTION);
    }
}
