package com.haruon.groupware.application.draft.required;

import com.haruon.groupware.domain.draft.SalesDraft;

public interface SalesDraftRepository extends DraftRepository {
    SalesDraft save(SalesDraft draft);
}
