package com.haruon.groupware.domain.empInfo.emp.dto;

import lombok.Builder;

@Builder
public record EmpFileStatusChangeParam (
        Long id,
        Boolean targetActive
) {
}
