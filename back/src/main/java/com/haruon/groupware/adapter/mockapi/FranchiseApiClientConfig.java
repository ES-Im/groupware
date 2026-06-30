package com.haruon.groupware.adapter.mockapi;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class FranchiseApiClientConfig {

    @Bean
    RestClient franchiseApiRestClient(
            RestClient.Builder builder,
            @Value("${APP_FRANCHISE_BASE_URL}") String baseUrl
    ) {
        return builder
                .baseUrl(baseUrl)
                .build();
    }
}
