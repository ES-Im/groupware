package com.haruon.groupware.application.draft.required;

import com.haruon.groupware.domain.draft_approval.report.BusinessTripDraft;

public interface BusinessTripDraftRepository extends DraftRepository {

    BusinessTripDraft save(BusinessTripDraft draft);

}
