package com.haruon.groupware.application.exception.company;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class CompanyNotFoundException extends ApplicationException {

    public CompanyNotFoundException() {
        super(ApplicationErrorCode.COMPANY_NOT_FOUND_EXCEPTION);
    }
}
