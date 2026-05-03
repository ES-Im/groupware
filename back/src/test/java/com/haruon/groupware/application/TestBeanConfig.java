package com.haruon.groupware.application;

import com.haruon.groupware.application.utils.CompanyPolicyPort;
import com.haruon.groupware.domain.empInfo.PasswordEncoder;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.time.LocalTime;
import java.util.Locale;

@TestConfiguration
public class TestBeanConfig {

    @Bean
    @Primary
    public PasswordEncoder passwordEncoder() {
        return new PasswordEncoder() {
            @Override
            public String encode(String rawPassword) {
                return rawPassword.toUpperCase(Locale.ROOT);
            }

            @Override
            public boolean matches(String rawPassword, String encodedPassword) {
                return rawPassword.toUpperCase(Locale.ROOT).equals(encodedPassword);
            }
        };
    }

    @Bean
    @Primary
    public CompanyPolicyPort companyPolicyPort() {
        return new CompanyPolicyPort() {
            @Override
            public LocalTime getStartTime() {
                return LocalTime.of(9, 0, 0);
            }

            @Override
            public LocalTime getEndTime() {
                return LocalTime.of(18, 0, 0);
            }

            @Override
            public Integer getWorkHours() {
                return 8;
            }

            @Override
            public LocalTime getBreakStartTime() {
                return LocalTime.of(12, 0, 0);
            }

            @Override
            public Integer getBreakHours() {
                return 1;
            }

            @Override
            public String getCompanyDomain() {
                return "@Haruon.com";
            }

            @Override
            public Double getDefaultAnnualLeaveDays() {
                return 15.0;
            }

            @Override
            public Double getMaxAnnualLeaveDays() {
                return 25.0;
            }

            @Override
            public Double getMaxAnnualLeaveDaysForFirstYearEmp() {
                return 11.0;
            }
        };
    }
//
//    @Bean
//    @Primary
//    public JPAQueryFactory jpaQueryFactory(EntityManager em) {
//        return new JPAQueryFactory(em);
//    }
}
