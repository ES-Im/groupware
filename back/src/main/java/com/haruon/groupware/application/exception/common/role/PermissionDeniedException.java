package com.haruon.groupware.application.exception.common.role;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class PermissionDeniedException extends ApplicationException {
    public PermissionDeniedException() {
        super(ErrorCode.PERMISSION_DENIED_EXCEPTION);
    }
}
