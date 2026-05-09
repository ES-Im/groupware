package com.haruon.groupware.adapter.persistence;

import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;


@Configuration
@EnableJpaAuditing
public class PersistenceConfig {

    @Bean
    public JPAQueryFactory jpaQueryFactory(EntityManager em) {
        return new JPAQueryFactory(em);
    }

    // QueryDSL - XML 파일 설정 후 적용 - https://openfeign.github.io/querydsl/tutorials/jpa/
//    HibernateDomainExporter exporter = new HibernateDomainExporter(
//            "Q",                     // name prefix
//            new File("target/gen3"), // target folder
//            configuration);          // instance of org.hibernate.cfg.Configuration
//
//    exporter.export();
}
