package com.haruon.groupware.application.exception.board;

import com.haruon.groupware.application.exception.ApplicationException;
import com.haruon.groupware.application.exception.ErrorCode;

public class ActiveCategoryNotFoundException extends ApplicationException {
    public ActiveCategoryNotFoundException() {
        super(ErrorCode.ACTIVE_CATEGORY_NOT_FOUND_EXCEPTION);
    }
}