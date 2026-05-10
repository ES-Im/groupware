package com.haruon.groupware.application.franchise.service.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.PositiveValueRequiredException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;

import java.time.LocalDate;

@Builder
public record DailySalesRequest(

        String externalId,

        LocalDate salesDate,

        Long salesAmount,

        Long orderCount
) {

    public DailySalesRequest {
        if(externalId == null || salesDate == null || salesAmount == null || orderCount == null) throw new RequiredValueMissingException();

        if(externalId.isBlank()) throw new BlankValueNotAllowedException();

        if(salesAmount < 0 || orderCount < 0) throw new PositiveValueRequiredException();
    }
}
