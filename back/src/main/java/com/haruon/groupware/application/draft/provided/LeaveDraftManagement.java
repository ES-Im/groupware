package com.haruon.groupware.application.draft.provided;

import com.haruon.groupware.application.draft.dto.LeaveDraftCreateRequest;
import com.haruon.groupware.application.draft.dto.LeaveDraftUpdateRequest;

/**
 * 휴가 기안서의 작성, 수정, 상신을 제공
 */
public interface LeaveDraftManagement {

    void createDraft(LeaveDraftCreateRequest param);

    void createSubmitted(LeaveDraftCreateRequest param);

    void updateDraft(LeaveDraftUpdateRequest param);

}
