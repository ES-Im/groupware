package com.haruon.groupware.application.exception.franchise;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class EducationRegisterMismatchException extends ApplicationException {
    public EducationRegisterMismatchException() {
        super(ApplicationErrorCode.EDUCATION_REGISTER_MISMATCH_EXCEPTION);
    }
}