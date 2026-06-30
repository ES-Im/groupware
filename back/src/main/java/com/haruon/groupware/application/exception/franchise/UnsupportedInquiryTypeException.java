package com.haruon.groupware.application.exception.franchise;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class UnsupportedInquiryTypeException extends ApplicationException {
    public UnsupportedInquiryTypeException() {
        super(ApplicationErrorCode.UNSUPPORTED_INQUIRY_TYPE_EXCEPTION);
    }
}
