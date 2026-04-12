package com.haruon.groupware.adapter;

import com.haruon.groupware.application.CompanyPolicyPort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalTime;

@Component
public class YamlAttendancePolicyAdapter implements CompanyPolicyPort {

    @Value("${HARUON_EMAIL_DOMAIN}")
    private String companyDomain;

    @Value("${HARUON_START_TIME}")
    private String startTime;

    @Value("${HARUON_END_TIME}")
    private String endTime;

    @Value("${HARUON_WORK_HOUR}")
    private String workHour;

    @Value("${HARUON_BREAK_HOUR}")
    private String breakHour;

    @Value("${DEFAULT_ANNUAL_LEAVE_DAYS}")
    private String defaultAnnualLeaveDays;

    @Value("${MAX_ANNUAL_LEAVE_DAYS}")
    private String maxAnnualLeaveDays;

    @Value("${MAX_ANNUAL_LEAVE_FOR_FIRST_YEAR_EMP}")
    private String maxAnnualLeaveForFirstYearEmp;

    @Value("${BREAKHOUR_START_TIME}")
    private String breakStartTime;

    @Override
    public Integer getWorkHours() {
        return Integer.parseInt(workHour);
    }

    @Override
    public Integer getBreakHours() {
        return Integer.parseInt(breakHour);
    }

    @Override
    public String getCompanyDomain() {
        return companyDomain;
    }

    @Override
    public LocalTime getStartTime() {
        return LocalTime.parse(startTime);
    }

    @Override
    public LocalTime getEndTime() {
        return LocalTime.parse(endTime);
    }

    @Override
    public Double getDefaultAnnualLeaveDays() {
        return Double.parseDouble(defaultAnnualLeaveDays);
    }

    @Override
    public Double getMaxAnnualLeaveDays() {
        return Double.parseDouble(maxAnnualLeaveDays);
    }

    @Override
    public Double getMaxAnnualLeaveDaysForFirstYearEmp() {
        return Double.parseDouble(maxAnnualLeaveForFirstYearEmp);
    }

    @Override
    public LocalTime getBreakStartTime() {
        return LocalTime.of(Integer.parseInt(breakStartTime), 0, 0);
    }
}
