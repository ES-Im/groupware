package com.haruon.groupware.application.draft.service.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;

@Builder
public record CancelDraftCreateRequest(

        CommonDraftCreateRequest param,

        String sourceKey

) {
    public CancelDraftCreateRequest {
        if(param == null || sourceKey == null) {
            throw new RequiredValueMissingException();
        }

        if(sourceKey.isBlank()) throw new BlankValueNotAllowedException();
    }
}
