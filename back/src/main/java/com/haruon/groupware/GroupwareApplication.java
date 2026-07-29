package com.haruon.groupware;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

@SpringBootApplication
public class GroupwareApplication {

    public static void main(String[] args) {

        ConfigurableApplicationContext context = SpringApplication.run(GroupwareApplication.class, args);

        if (context.getEnvironment().getProperty("spring.batch.job.name") != null) {
            System.exit(SpringApplication.exit(context));
        }

    }

}
