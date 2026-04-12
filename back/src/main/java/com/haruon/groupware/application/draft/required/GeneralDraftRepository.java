package com.haruon.groupware.application.draft.required;

import com.haruon.groupware.domain.draft_approval.report.GeneralDraft;

public interface GeneralDraftRepository extends DraftRepository {

    GeneralDraft save(GeneralDraft draft);

}
