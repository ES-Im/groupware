package com.haruon.groupware.domain.empInfo.dto;

import lombok.Builder;

@Builder
public record EmpFileStatusChangeParam (
        Long id,
        Boolean targetActive
) {
}
