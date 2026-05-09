package com.haruon.groupware.application.empInfo.empService.dto;

import lombok.Builder;

import static java.util.Objects.requireNonNull;

@Builder
public record EmpFileStatusChangeParam (
        Long fileId,

        Boolean targetActive
) {

    public EmpFileStatusChangeParam {
        requireNonNull(fileId, "파일 지정되지 않음");
        requireNonNull(targetActive, "활성화 여부 미체크");
    }
}
