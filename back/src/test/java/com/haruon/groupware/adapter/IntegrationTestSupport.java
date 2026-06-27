package com.haruon.groupware.adapter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.haruon.groupware.adapter.redis.auth.RefreshTokenRedis;
import com.haruon.groupware.adapter.security.JwtCookieManager;
import com.haruon.groupware.application.auth.provided.forCommand.AuthManagement;
import com.haruon.groupware.application.auth.required.TokenParser;
import com.haruon.groupware.application.company.required.CompanyRepository;
import com.haruon.groupware.application.dept.required.DeptRepository;
import com.haruon.groupware.application.employee.account.provided.forCommand.EmpAccountManager;
import com.haruon.groupware.application.employee.account.required.EmpQueryRepository;
import com.haruon.groupware.application.employee.account.required.EmpRepository;
import com.haruon.groupware.application.employee.leave.required.EmpLeaveRepository;
import com.haruon.groupware.domain.employee.Dept;
import com.haruon.groupware.domain.employee.EmpPasswordEncoder;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

@Slf4j
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class IntegrationTestSupport {

    @Autowired protected MockMvc mockMvc;
    @Autowired protected StringRedisTemplate redisTemplate;
    @Autowired protected AuthManagement authManagement;
    @Autowired protected JwtCookieManager jwtCookieManager;
    @Autowired protected RefreshTokenRedis refreshTokenRedis;
    @Autowired protected EmpAccountManager empAccountManager;
    @Autowired protected ObjectMapper objectMapper;
    @Autowired protected EmpPasswordEncoder empPasswordEncoder;
    @Autowired protected TokenParser tokenParser;
    @Autowired protected EmpPasswordEncoder encoder;

    @Autowired protected CompanyRepository companyRepository;
    @Autowired protected DeptRepository deptRepository;
    @Autowired protected EmpRepository empRepository;
    @Autowired protected EmpLeaveRepository empLeaveRepository;

    @Autowired protected EmpQueryRepository empQueryRepository;
    @Autowired protected EntityManager entityManager;
    @Autowired protected PlatformTransactionManager transactionManager;


    @AfterEach
    void tearDown() {
        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            cleanDatabase();
        }

        redisTemplate.delete("auth:refresh:test12345");
    }

    private void cleanDatabase() {
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
        transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        transactionTemplate.executeWithoutResult(status -> {
            entityManager.createQuery("delete from DeptLeader").executeUpdate();
            entityManager.createQuery("update Dept d set d.parentDept = null").executeUpdate();
            entityManager.clear();

            companyRepository.deleteAll();
            empLeaveRepository.deleteAll();
            empRepository.deleteAll();
            deptRepository.deleteAll();
        });
    }

    protected static final String REFRESH_TOKEN_KEY_PREFIX = "auth:refresh:";
    protected static final String BEARER = "Bearer ";

    // 로그인 -> accessToken 발급
    protected String loginByIdAndPw(String loginId, String password) throws Exception {
        return IntegrityTestFixtures.getAccessToken(
                empRepository, encoder, mockMvc, objectMapper, loginId, password
        );
    }

    // 가입신청한 사원
    protected void registerEmp(String loginId, String password) {
        IntegrityTestFixtures.registeredEmp(
                empRepository, encoder, loginId, password
        );
    }

    // 가입 승인된 사원
    protected void activatedEmp(String loginId, String password) {
        IntegrityTestFixtures.registerAndApproveEmp(
                empRepository, encoder, loginId, password
        );
    }

    // 휴직 등 정직상태
    protected void suspendedEmp(String loginId, String password) {
        IntegrityTestFixtures.suspendedEmp(
                empRepository, encoder, loginId, password
        );
    }

    // 인사권한으로 등록
    protected void registerHR(String loginId, String password) {
        IntegrityTestFixtures.getEmpHavingWithHrRole(
                empRepository, deptRepository, encoder, loginId, password
        );
    }

    protected void registerAdmin(String loginId, String password) {
        IntegrityTestFixtures.getAdmin(
                empRepository, deptRepository, encoder, loginId, password
        );
    }

    protected void registerDeptManager(String loginId, String password, Dept dept) {
        IntegrityTestFixtures.getEmpHavingWithManagerRole(
                empRepository, deptRepository, encoder, loginId, password, dept
        );
    }

    protected void registerEmpHavingAllInfo(String loginId, String password) {
        IntegrityTestFixtures.getEmpHavingAllInfo(
                empRepository, deptRepository, encoder, loginId, password
        );
    }

    protected Dept getDept(String deptCode, String deptName) {
        return deptRepository.findByDeptCode(deptCode).orElseGet(() ->
                deptRepository.save(
                        Dept.registerDept(deptCode, deptName)
                )
        );
    }

}
