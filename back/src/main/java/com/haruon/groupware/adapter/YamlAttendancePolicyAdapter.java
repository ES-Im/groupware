package com.haruon.groupware.adapter;

import com.haruon.groupware.application.CompanyPolicyPort;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.LocalTime;

@Component
@ConfigurationProperties(prefix = "haruon")
@Getter
@Setter
public class YamlAttendancePolicyAdapter implements CompanyPolicyPort {

    @Value("${HARUON_EMAIL_DOMAIN}")
    private String companyDomain;

    @Value("${HARUON_START_TIME}")
    private String startTime;

    @Value("${HARUON_END_TIME}")
    private String endTime;

    @Value("${HARUON_WORKING_HOUR}")
    private String workHour;

    @Value("${HARUON_BREAK_HOUR}")
    private String breakHour;

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
}
