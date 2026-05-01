package com.haruon.groupware.queryDLSTest;

import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Repository;

@Repository
public class QueryDSL {

        private final JPAQueryFactory queryFactory;

        public QueryDSL(EntityManager em) {
            this.queryFactory = new JPAQueryFactory(em);
        }

//        public List<Emp> findAllEmp() {
//            return queryFactory
//                    .selectFrom(emp)
//                    .fetch();
//        }
}