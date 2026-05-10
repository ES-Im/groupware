package com.haruon.groupware.application.exception.franchise;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class EducationNotFoundException extends ApplicationException {
    public EducationNotFoundException() {
        super(ErrorCode.EDUCATION_NOT_FOUND_EXCEPTION);
    }
}