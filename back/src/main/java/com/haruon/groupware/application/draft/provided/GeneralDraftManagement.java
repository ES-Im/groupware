package com.haruon.groupware.application.draft.provided;

import com.haruon.groupware.application.draft.dto.CommonDraftCreateRequest;
import com.haruon.groupware.application.draft.dto.CommonDraftUpdateRequest;

/**
 * 일반 기안서의 작성, 수정, 상신을 제공
 */
public interface GeneralDraftManagement {

    void createDraft(CommonDraftCreateRequest param);

    void createSubmitted(CommonDraftCreateRequest param);

    void updateDraft(CommonDraftUpdateRequest param);

}
