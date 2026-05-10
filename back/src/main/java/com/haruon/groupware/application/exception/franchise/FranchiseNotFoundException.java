package com.haruon.groupware.application.exception.franchise;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class FranchiseNotFoundException extends ApplicationException {
    public FranchiseNotFoundException() {
        super(ErrorCode.FRANCHISE_NOT_FOUND_EXCEPTION);
    }
}
