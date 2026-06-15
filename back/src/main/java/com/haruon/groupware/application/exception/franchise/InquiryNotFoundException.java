package com.haruon.groupware.application.exception.franchise;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class InquiryNotFoundException extends ApplicationException {
    public InquiryNotFoundException() {
        super(ApplicationErrorCode.INQUIRY_NOT_FOUND_EXCEPTION);
    }
}
