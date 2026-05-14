package com.haruon.groupware.application.exception.franchise;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class EducationNotFoundException extends ApplicationException {
    public EducationNotFoundException() {
        super(ApplicationErrorCode.EDUCATION_NOT_FOUND_EXCEPTION);
    }
}