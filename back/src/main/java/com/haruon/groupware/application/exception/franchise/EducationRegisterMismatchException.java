package com.haruon.groupware.application.exception.franchise;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class EducationRegisterMismatchException extends ApplicationException {
    public EducationRegisterMismatchException() {
        super(ErrorCode.EDUCATION_REGISTER_MISMATCH_EXCEPTION);
    }
}