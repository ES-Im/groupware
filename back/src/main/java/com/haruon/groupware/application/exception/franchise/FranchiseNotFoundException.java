package com.haruon.groupware.application.exception.franchise;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class FranchiseNotFoundException extends ApplicationException {
    public FranchiseNotFoundException() {
        super(ApplicationErrorCode.FRANCHISE_NOT_FOUND_EXCEPTION);
    }
}
