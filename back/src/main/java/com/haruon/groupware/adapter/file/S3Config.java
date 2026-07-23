package com.haruon.groupware.adapter.file;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.Bucket;
import software.amazon.awssdk.services.s3.model.ListBucketsResponse;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.util.List;

@Configuration
@Profile("prod")
public class S3Config {

    @Bean
    public S3Client s3Client() {
        Region seoul = Region.AP_NORTHEAST_2;

        return S3Client.builder()
                .region(seoul)
                .build();
    }

}
