package com.haruon.groupware.queryDLSTest;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.QDept;
import com.haruon.groupware.domain.empInfo.QEmp;
import com.haruon.groupware.domain.empInfo.QEmpBelongings;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static com.haruon.groupware.domain.empInfo.QEmp.emp;

@Slf4j
@TestIntegrationConfig
public class EmpQueryRepositoryTest {

    @Autowired
    JPAQueryFactory queryFactory;

    @Autowired
    EmpRepository empRepository;

    @Autowired
    EntityManager entityManager;


    public List<Emp> findAll() {
        return queryFactory
                .selectFrom(emp)
                .fetch();
    }

    public Emp save() {
        return saveApprovedEmp(empRepository);
    }

    @Test
    @DisplayName("DSLTest")
    void test() {
        findAll();
    }

    @Test
    void d() {
        QEmp emp = QEmp.emp;
        QEmpBelongings QEmpBelonging = QEmpBelongings.empBelongings;
        QDept dept = QDept.dept;

        queryFactory
                .select(emp)
                .from(emp)
                .join(emp.empBelongings, QEmpBelonging)
                .join(QEmpBelonging.dept, dept)
                .fetch();
    }


//

}
