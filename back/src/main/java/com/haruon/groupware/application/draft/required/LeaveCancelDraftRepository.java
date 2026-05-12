package com.haruon.groupware.application.draft.required;

import com.haruon.groupware.domain.draft.LeaveCancelDraft;

public interface LeaveCancelDraftRepository extends DraftRepository {

    LeaveCancelDraft save(LeaveCancelDraft draft);

}
