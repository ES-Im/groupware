package com.haruon.groupware.application.schedule.service;

import com.haruon.groupware.domain.empInfo.Emp;
import lombok.Builder;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Builder
public record ManualScheduleParam(

        Emp owner,

        String title,

        String content,

        LocalDateTime startAt,

        LocalDateTime endAt

) {
    public ManualScheduleParam {

        requireNonNull(startAt, "시작일시 정보 없음");
        requireNonNull(endAt, "종료일시 정보 없음");
        requireNonNull(owner, "일정 소유자 정보 없음");
        requireNonNull(title, "일정 제목 없음");
        requireNonNull(content, "일정 내용 없음");

        state(!endAt.isBefore(startAt), "종료일시는 시작일시보다 빠를 수 없음");
    }
}
