package com.haruon.groupware.domain.schedule;

import com.haruon.groupware.domain.empInfo.emp.Emp;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

public record RegisterPersonalScheduleParam (

        Emp owner,

        String title,

        String content,

        LocalDateTime startedAt,

        LocalDateTime endAt,

        boolean isAllDay,

        boolean isForDivision,

        String companyStartTime,

        String companyEndTime
) {

    public RegisterPersonalScheduleParam {
        requireNonNull(companyStartTime != null && companyEndTime != null, "회사 정책 값은 필수입력값");

        requireNonNull(startedAt, "시작일시 정보 없음");
        requireNonNull(endAt, "종료일시 정보 없음");
        requireNonNull(owner, "일정 소유자 정보 없음");

        state(endAt.isAfter(startedAt), "종료일시는 시작일시보다 빠를 수 없음");
    }
}
