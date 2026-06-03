package com.haruon.groupware.application.exception.company;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class CompanyAlreadyExistsException extends ApplicationException {

    public CompanyAlreadyExistsException() {
        super(ApplicationErrorCode.COMPANY_ALREADY_EXISTS_EXCEPTION);
    }
}
