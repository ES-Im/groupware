package com.haruon.groupware.application.empInfo.empService.dto;

import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;

@Builder
public record EmpFileStatusChangeParam (
        Long fileId,

        Boolean targetActive
) {

    public EmpFileStatusChangeParam {
        if(fileId == null || targetActive == null) throw new RequiredValueMissingException();
    }
}
