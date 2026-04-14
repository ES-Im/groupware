package com.haruon.groupware.application.draft.required;

import com.haruon.groupware.domain.draft.LeaveDraft;

public interface LeaveDraftRepository extends DraftRepository {

    LeaveDraft save(LeaveDraft leaveDraft);

}
