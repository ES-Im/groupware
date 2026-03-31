package com.haruon.groupware.application;

import java.time.LocalTime;

/*
 * 회사 정책 불변 변수들을 외부에서 가져오는 인터페이스
 */
public interface CompanyPolicyPort {

    LocalTime getStartTime();

    LocalTime getEndTime();

    Integer getWorkHours();

    Integer getBreakHours();

    String getCompanyDomain();
}
