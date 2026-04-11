package com.haruon.groupware.application.draft.provided;

import com.haruon.groupware.application.draft.dto.SalesDraftCreateRequest;
import com.haruon.groupware.application.draft.dto.SalesDraftUpdateRequest;

/**
 * 매출보고 기안서의 작성, 수정, 상신을 제공
 */
public interface SalesDraftManagement {

    void createDraft(SalesDraftCreateRequest param);

    void createSubmitted(SalesDraftCreateRequest param);

    void updateDraft(SalesDraftUpdateRequest param);

}
