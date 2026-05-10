package com.haruon.groupware.application.exception.board;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class CategoryNotFoundException extends ApplicationException {
    public CategoryNotFoundException() {
        super(ErrorCode.CATEGORY_NOT_FOUND_EXCEPTION);
    }
}
