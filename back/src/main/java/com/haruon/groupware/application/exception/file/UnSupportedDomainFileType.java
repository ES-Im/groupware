package com.haruon.groupware.application.exception.file;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class UnSupportedDomainFileType extends ApplicationException {
    public UnSupportedDomainFileType() {
        super(ApplicationErrorCode.UNSUPPORTED_DOMAIN_FILE_TYPE);
    }
}
