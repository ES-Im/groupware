package com.haruon.groupware.application.exception.board;

import com.haruon.groupware.application.exception.ApplicationErrorCode;
import com.haruon.groupware.application.exception.ApplicationException;

public class CategoryNotFoundException extends ApplicationException {
    public CategoryNotFoundException() {
        super(ApplicationErrorCode.CATEGORY_NOT_FOUND_EXCEPTION);
    }
}
