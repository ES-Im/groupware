package com.haruon.groupware.adapter;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "haruon")
@Getter
@Setter
public class HaruonProperties {

    @Value("${HARUON_EMAIL_DOMAIN}")
    private String companyDomain;

    @Value("${HARUON_START_TIME}")
    private String startTime;

    @Value("${HARUON_END_TIME}")
    private String endTime;
}
