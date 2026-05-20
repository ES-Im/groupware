package com.haruon.groupware.application.exception.franchise;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class FranchiseInquiryNotFoundException extends ApplicationException {
    public FranchiseInquiryNotFoundException() {
        super(ApplicationErrorCode.FRANCHISE_INQUIRY_NOT_FOUND_EXCEPTION);
    }
}
